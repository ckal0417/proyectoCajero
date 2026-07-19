import { createHash } from 'crypto';
import { PoolClient } from 'pg';
import { CuentaRepositoryPostgres } from '../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PostgresConnection } from '../../Infrastructure/Database/PostgresConnection';
import logger from '../../shared/Logger';
import { Resultado, ResultadoOperacion } from '../models/Resultado';

interface FilaCuentaTarjeta {
    id_cuenta: number;
}

interface FilaCuentaDestino {
    id_cuenta: number;
}

interface FilaCuentaNumero {
    numero_cuenta: string;
}

interface FilaTitularCuenta {
    numero_cuenta: string;
    nombre_cliente: string;
}

interface FilaCuentaBloqueada {
    id_cuenta: number;
    saldo: string;
    activa: boolean;
}

interface FilaTransaccion {
    id_transaccion: number;
}

interface FilaIdempotencia {
    request_hash: string;
    estado: 'EN_PROCESO' | 'COMPLETADA';
    respuesta_http: number | null;
    respuesta_body: unknown;
}

interface FilaHistorial {
    tipo: string;
    monto: string;
    fecha: Date;
}

type TipoOperacionIdempotente = 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA';

type EstadoIdempotencia =
    | { tipo: 'NUEVA' }
    | { tipo: 'REPLAY'; statusCode: number; body: unknown }
    | { tipo: 'CONFLICTO'; statusCode: number; body: { error: string } };

export interface ServiceResponse {
    status: number;
    body: unknown;
}

interface TitularCuentaResponse {
    numeroCuenta: string;
    nombreCliente: string;
}

export class OperacionesBancariasService {
    private readonly cuentaRepository = new CuentaRepositoryPostgres();

    private readonly pool = PostgresConnection.obtenerPool();

    async obtenerSaldo(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        try {
            if (!numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idCuenta = await this.obtenerIdCuentaPorTarjeta(numeroTarjeta);

            if (idCuenta === null) {
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuenta = await this.cuentaRepository.buscarPorId(idCuenta);

            if (!cuenta) {
                return this.fallido('Cuenta no encontrada', 404);
            }

            logger.info(`Consulta de saldo para tarjeta: ${numeroTarjeta}`);
            return ResultadoOperacion.exitoso({ status: 200, body: { saldo: cuenta.obtenerSaldo().toNumber() } });
        } catch (error) {
            logger.error('Error consultando saldo:', error);
            return this.fallido('Error interno del servidor', 500);
        }
    }

    async obtenerHistorial(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        try {
            if (!numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idCuenta = await this.obtenerIdCuentaPorTarjeta(numeroTarjeta);

            if (idCuenta === null) {
                return this.fallido('Cuenta no encontrada', 404);
            }

            const resultado = await this.pool.query<FilaHistorial>(
                `
                SELECT m.naturaleza AS tipo, m.monto, m.fecha
                FROM BancoFuego.Movimiento m
                WHERE m.id_cuenta = $1
                ORDER BY m.fecha DESC
                `,
                [idCuenta],
            );

            const historial = resultado.rows.map((fila) => ({
                tipo: fila.tipo,
                monto: Number(fila.monto),
                fecha: fila.fecha,
            }));

            if (historial.length === 0) {
                logger.info(`Historial vacio para tarjeta: ${numeroTarjeta}`);
                return ResultadoOperacion.exitoso({ status: 200, body: { historial: [], mensaje: 'No hay transacciones' } });
            }

            logger.info(`Consulta de historial para tarjeta: ${numeroTarjeta}`);
            return ResultadoOperacion.exitoso({ status: 200, body: { historial } });
        } catch (error) {
            logger.error('Error obteniendo historial:', error);
            return this.fallido('Error interno del servidor', 500);
        }
    }

    async obtenerTitularCuenta(numeroCuenta: string): Promise<Resultado<TitularCuentaResponse>> {
        try {
            const numeroCuentaNormalizado = numeroCuenta.trim();
            if (numeroCuentaNormalizado.length === 0) {
                return ResultadoOperacion.fallido({ mensaje: 'Número de cuenta destino inválido', statusCode: 400 });
            }

            const resultado = await this.pool.query<FilaTitularCuenta>(
                `
                SELECT c.numero_cuenta, CONCAT(cl.nombres, ' ', cl.apellidos) AS nombre_cliente
                FROM BancoFuego.Cuenta c
                INNER JOIN BancoFuego.Cliente cl ON cl.id_cliente = c.id_cliente
                WHERE c.numero_cuenta = $1
                LIMIT 1
                `,
                [numeroCuentaNormalizado],
            );

            if (resultado.rowCount === 0) {
                return ResultadoOperacion.fallido({ mensaje: 'Cuenta destino no encontrada', statusCode: 404 });
            }

            const titular = resultado.rows[0]!;
            return ResultadoOperacion.exitoso({
                numeroCuenta: titular.numero_cuenta,
                nombreCliente: titular.nombre_cliente,
            });
        } catch (error) {
            logger.error('Error obteniendo titular de cuenta:', error);
            return ResultadoOperacion.fallido({ mensaje: 'Error interno del servidor', statusCode: 500 });
        }
    }

    async depositar(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        const client = await this.pool.connect();
        try {
            if (!args.numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idempotencyKey = args.idempotencyKey ?? null;

            const montoNumero = Number(args.monto);
            if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
                return this.fallido('Monto debe ser mayor a 0', 400);
            }

            await client.query('BEGIN');

            if (idempotencyKey) {
                const requestHash = this.crearHashOperacion({
                    numeroTarjeta: args.numeroTarjeta,
                    monto: montoNumero,
                    endpoint: 'DEPOSITO',
                });

                const estadoIdempotencia = await this.iniciarIdempotencia(
                    client,
                    args.numeroTarjeta,
                    'DEPOSITO',
                    idempotencyKey,
                    requestHash,
                );

                if (estadoIdempotencia.tipo === 'REPLAY') {
                    await client.query('COMMIT');
                    return ResultadoOperacion.exitoso({
                        status: estadoIdempotencia.statusCode,
                        body: estadoIdempotencia.body,
                    });
                }

                if (estadoIdempotencia.tipo === 'CONFLICTO') {
                    await client.query('ROLLBACK');
                    return this.fallido(estadoIdempotencia.body.error, estadoIdempotencia.statusCode);
                }
            }

            const idCuenta = await this.obtenerIdCuentaPorTarjetaTx(client, args.numeroTarjeta);

            if (idCuenta === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuenta = await this.obtenerCuentaBloqueada(client, idCuenta);

            if (!cuenta) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            if (!cuenta.activa) {
                await client.query('ROLLBACK');
                return this.fallido('La cuenta no esta activa', 409);
            }

            const saldoAnterior = Number(cuenta.saldo);
            const saldoNuevo = saldoAnterior + montoNumero;

            await client.query(
                `
                UPDATE BancoFuego.Cuenta
                SET saldo = $1
                WHERE id_cuenta = $2
                `,
                [saldoNuevo, idCuenta],
            );

            const transaccion = await client.query<FilaTransaccion>(
                `
                INSERT INTO BancoFuego.Transaccion (tipo, monto, estado, descripcion)
                VALUES ('DEPOSITO', $1, 'EXITOSA', 'Deposito por API')
                RETURNING id_transaccion
                `,
                [montoNumero],
            );

            const idTransaccion = transaccion.rows[0]!.id_transaccion;

            await client.query(
                `
                INSERT INTO BancoFuego.Movimiento
                    (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
                VALUES ('CREDITO', $1, $2, $3, $4, $5)
                `,
                [montoNumero, saldoAnterior, saldoNuevo, idCuenta, idTransaccion],
            );

            const respuesta = {
                mensaje: 'Deposito exitoso',
                nuevoSaldo: saldoNuevo,
            };

            if (idempotencyKey) {
                await this.completarIdempotencia(
                    client,
                    args.numeroTarjeta,
                    'DEPOSITO',
                    idempotencyKey,
                    200,
                    respuesta,
                );
            }

            await client.query('COMMIT');

            logger.info(`Deposito exitoso: $${montoNumero} para tarjeta ${args.numeroTarjeta}`);
            return ResultadoOperacion.exitoso({ status: 200, body: respuesta });
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Ignore rollback errors and keep original error.
            }
            logger.error('Error en deposito:', error);
            return this.fallido('Error interno del servidor', 500);
        } finally {
            client.release();
        }
    }

    async retirar(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        const client = await this.pool.connect();
        try {
            if (!args.numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idempotencyKey = args.idempotencyKey ?? null;

            const montoNumero = Number(args.monto);
            if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
                return this.fallido('Monto debe ser mayor a 0', 400);
            }

            await client.query('BEGIN');

            if (idempotencyKey) {
                const requestHash = this.crearHashOperacion({
                    numeroTarjeta: args.numeroTarjeta,
                    monto: montoNumero,
                    endpoint: 'RETIRO',
                });

                const estadoIdempotencia = await this.iniciarIdempotencia(
                    client,
                    args.numeroTarjeta,
                    'RETIRO',
                    idempotencyKey,
                    requestHash,
                );

                if (estadoIdempotencia.tipo === 'REPLAY') {
                    await client.query('COMMIT');
                    return ResultadoOperacion.exitoso({
                        status: estadoIdempotencia.statusCode,
                        body: estadoIdempotencia.body,
                    });
                }

                if (estadoIdempotencia.tipo === 'CONFLICTO') {
                    await client.query('ROLLBACK');
                    return this.fallido(estadoIdempotencia.body.error, estadoIdempotencia.statusCode);
                }
            }

            const idCuenta = await this.obtenerIdCuentaPorTarjetaTx(client, args.numeroTarjeta);

            if (idCuenta === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuenta = await this.obtenerCuentaBloqueada(client, idCuenta);

            if (!cuenta) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            if (!cuenta.activa) {
                await client.query('ROLLBACK');
                return this.fallido('La cuenta no esta activa', 409);
            }

            const saldoAnterior = Number(cuenta.saldo);
            if (saldoAnterior < montoNumero) {
                await client.query('ROLLBACK');
                return this.fallido('Fondos insuficientes', 400);
            }

            const saldoNuevo = saldoAnterior - montoNumero;

            await client.query(
                `
                UPDATE BancoFuego.Cuenta
                SET saldo = $1
                WHERE id_cuenta = $2
                `,
                [saldoNuevo, idCuenta],
            );

            const transaccion = await client.query<FilaTransaccion>(
                `
                INSERT INTO BancoFuego.Transaccion (tipo, monto, estado, descripcion)
                VALUES ('RETIRO', $1, 'EXITOSA', 'Retiro por API')
                RETURNING id_transaccion
                `,
                [montoNumero],
            );

            const idTransaccion = transaccion.rows[0]!.id_transaccion;

            await client.query(
                `
                INSERT INTO BancoFuego.Movimiento
                    (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
                VALUES ('DEBITO', $1, $2, $3, $4, $5)
                `,
                [montoNumero, saldoAnterior, saldoNuevo, idCuenta, idTransaccion],
            );

            const respuesta = {
                mensaje: 'Retiro exitoso',
                nuevoSaldo: saldoNuevo,
            };

            if (idempotencyKey) {
                await this.completarIdempotencia(
                    client,
                    args.numeroTarjeta,
                    'RETIRO',
                    idempotencyKey,
                    200,
                    respuesta,
                );
            }

            await client.query('COMMIT');

            logger.info(`Retiro exitoso: $${montoNumero} para tarjeta ${args.numeroTarjeta}`);
            return ResultadoOperacion.exitoso({ status: 200, body: respuesta });
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Ignore rollback errors and keep original error.
            }
            logger.warn(`Retiro fallido para tarjeta ${args.numeroTarjeta}: ${String(error)}`);
            return this.fallido('Error interno del servidor', 500);
        } finally {
            client.release();
        }
    }

    async transferir(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        numeroCuentaDestino: unknown;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        const client = await this.pool.connect();
        try {
            if (!args.numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idempotencyKey = args.idempotencyKey ?? null;

            const numeroCuentaDestino = String(args.numeroCuentaDestino ?? '');
            const montoNumero = Number(args.monto);

            if (!numeroCuentaDestino || !Number.isFinite(montoNumero) || montoNumero <= 0) {
                return this.fallido('numeroCuentaDestino y monto (mayor a 0) son requeridos', 400);
            }

            await client.query('BEGIN');

            if (idempotencyKey) {
                const requestHash = this.crearHashOperacion({
                    numeroTarjeta: args.numeroTarjeta,
                    numeroCuentaDestino,
                    monto: montoNumero,
                    endpoint: 'TRANSFERENCIA',
                });

                const estadoIdempotencia = await this.iniciarIdempotencia(
                    client,
                    args.numeroTarjeta,
                    'TRANSFERENCIA',
                    idempotencyKey,
                    requestHash,
                );

                if (estadoIdempotencia.tipo === 'REPLAY') {
                    await client.query('COMMIT');
                    return ResultadoOperacion.exitoso({
                        status: estadoIdempotencia.statusCode,
                        body: estadoIdempotencia.body,
                    });
                }

                if (estadoIdempotencia.tipo === 'CONFLICTO') {
                    await client.query('ROLLBACK');
                    return this.fallido(estadoIdempotencia.body.error, estadoIdempotencia.statusCode);
                }
            }

            const idCuentaOrigen = await this.obtenerIdCuentaPorTarjetaTx(client, args.numeroTarjeta);
            if (idCuentaOrigen === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta origen no encontrada', 404);
            }

            const numeroCuentaOrigen = await this.obtenerNumeroCuentaPorIdTx(client, idCuentaOrigen);
            if (numeroCuentaOrigen === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta origen no encontrada', 404);
            }

            const idCuentaDestino = await this.obtenerIdCuentaPorNumeroTx(client, numeroCuentaDestino);
            if (idCuentaDestino === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta destino no encontrada', 404);
            }

            if (idCuentaOrigen === idCuentaDestino) {
                await client.query('ROLLBACK');
                return this.fallido('La cuenta destino debe ser distinta a la de origen', 400);
            }

            const idsOrdenados = [idCuentaOrigen, idCuentaDestino].sort((a, b) => a - b);
            const cuentasBloqueadas = await client.query<FilaCuentaBloqueada>(
                `
                SELECT c.id_cuenta, c.saldo, c.activa
                FROM BancoFuego.Cuenta c
                WHERE c.id_cuenta = ANY($1::int[])
                ORDER BY c.id_cuenta
                FOR UPDATE
                `,
                [idsOrdenados],
            );

            if (cuentasBloqueadas.rowCount !== 2) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuentaOrigen = cuentasBloqueadas.rows.find((fila) => fila.id_cuenta === idCuentaOrigen);
            const cuentaDestino = cuentasBloqueadas.rows.find((fila) => fila.id_cuenta === idCuentaDestino);

            if (!cuentaOrigen || !cuentaDestino) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            if (!cuentaOrigen.activa || !cuentaDestino.activa) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no activa', 409);
            }

            const saldoAnteriorOrigen = Number(cuentaOrigen.saldo);
            const saldoAnteriorDestino = Number(cuentaDestino.saldo);

            if (saldoAnteriorOrigen < montoNumero) {
                await client.query('ROLLBACK');
                return this.fallido('Fondos insuficientes', 400);
            }

            const saldoNuevoOrigen = saldoAnteriorOrigen - montoNumero;
            const saldoNuevoDestino = saldoAnteriorDestino + montoNumero;

            await client.query(
                `
                UPDATE BancoFuego.Cuenta
                SET saldo = CASE
                    WHEN id_cuenta = $1 THEN $2::numeric
                    WHEN id_cuenta = $3 THEN $4::numeric
                END
                WHERE id_cuenta IN ($1, $3)
                `,
                [idCuentaOrigen, saldoNuevoOrigen, idCuentaDestino, saldoNuevoDestino],
            );

            const transaccion = await client.query<FilaTransaccion>(
                `
                INSERT INTO BancoFuego.Transaccion (tipo, monto, estado, descripcion)
                VALUES ('TRANSFERENCIA_INTERNA', $1, 'EXITOSA', 'Transferencia interna')
                RETURNING id_transaccion
                `,
                [montoNumero],
            );

            const idTransaccion = transaccion.rows[0]!.id_transaccion;

            await client.query(
                `
                INSERT INTO BancoFuego.Movimiento
                    (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
                VALUES
                    ('DEBITO', $1, $2, $3, $4, $6),
                    ('CREDITO', $1, $5, $7, $8, $6)
                `,
                [
                    montoNumero,
                    saldoAnteriorOrigen,
                    saldoNuevoOrigen,
                    idCuentaOrigen,
                    saldoAnteriorDestino,
                    idTransaccion,
                    saldoNuevoDestino,
                    idCuentaDestino,
                ],
            );

            const respuesta = {
                mensaje: 'Transferencia exitosa',
                numeroCuentaOrigen,
                numeroCuentaDestino,
                nuevoSaldo: saldoNuevoOrigen,
            };

            if (idempotencyKey) {
                await this.completarIdempotencia(
                    client,
                    args.numeroTarjeta,
                    'TRANSFERENCIA',
                    idempotencyKey,
                    200,
                    respuesta,
                );
            }

            await client.query('COMMIT');

            logger.info(
                `Transferencia exitosa: $${montoNumero} desde cuenta ${numeroCuentaOrigen} a ${numeroCuentaDestino}`,
            );
            return ResultadoOperacion.exitoso({ status: 200, body: respuesta });
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Ignore rollback errors and keep original error.
            }
            logger.warn(`Transferencia fallida: ${String(error)}`);
            return this.fallido('Error interno del servidor', 500);
        } finally {
            client.release();
        }
    }

    obtenerIdempotencyKey(headerValue: string | string[] | undefined): string | null {
        if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
            return headerValue.trim();
        }

        if (Array.isArray(headerValue) && headerValue.length > 0) {
            const firstValue = headerValue[0]?.trim();
            if (firstValue && firstValue.length > 0) {
                return firstValue;
            }
        }

        return null;
    }

    private crearHashOperacion(payload: unknown): string {
        return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    }

    private async obtenerIdCuentaPorTarjeta(numeroTarjeta: string): Promise<number | null> {
        const resultado = await this.pool.query<FilaCuentaTarjeta>(
            `
            SELECT t.id_cuenta
            FROM BancoFuego.Tarjeta t
            WHERE t.numero_tarjeta = $1
            LIMIT 1
            `,
            [numeroTarjeta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.id_cuenta;
    }

    private async obtenerIdCuentaPorTarjetaTx(client: PoolClient, numeroTarjeta: string): Promise<number | null> {
        const resultado = await client.query<FilaCuentaTarjeta>(
            `
            SELECT t.id_cuenta
            FROM BancoFuego.Tarjeta t
            WHERE t.numero_tarjeta = $1
            LIMIT 1
            `,
            [numeroTarjeta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.id_cuenta;
    }

    private async obtenerIdCuentaPorNumeroTx(client: PoolClient, numeroCuenta: string): Promise<number | null> {
        const resultado = await client.query<FilaCuentaDestino>(
            `
            SELECT c.id_cuenta
            FROM BancoFuego.Cuenta c
            WHERE c.numero_cuenta = $1
            LIMIT 1
            `,
            [numeroCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.id_cuenta;
    }

    private async obtenerNumeroCuentaPorIdTx(client: PoolClient, idCuenta: number): Promise<string | null> {
        const resultado = await client.query<FilaCuentaNumero>(
            `
            SELECT c.numero_cuenta
            FROM BancoFuego.Cuenta c
            WHERE c.id_cuenta = $1
            LIMIT 1
            `,
            [idCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.numero_cuenta;
    }

    private async iniciarIdempotencia(
        client: PoolClient,
        numeroTarjeta: string,
        endpoint: TipoOperacionIdempotente,
        idempotencyKey: string,
        requestHash: string,
    ): Promise<EstadoIdempotencia> {
        const insercion = await client.query<{ id_idempotencia: number }>(
            `
            INSERT INTO BancoFuego.IdempotenciaOperacion
                (numero_tarjeta, endpoint, idempotency_key, request_hash, estado)
            VALUES ($1, $2, $3, $4, 'EN_PROCESO')
            ON CONFLICT (numero_tarjeta, endpoint, idempotency_key) DO NOTHING
            RETURNING id_idempotencia
            `,
            [numeroTarjeta, endpoint, idempotencyKey, requestHash],
        );

        if (insercion.rowCount === 1) {
            return { tipo: 'NUEVA' };
        }

        const existente = await client.query<FilaIdempotencia>(
            `
            SELECT request_hash, estado, respuesta_http, respuesta_body
            FROM BancoFuego.IdempotenciaOperacion
            WHERE numero_tarjeta = $1
                AND endpoint = $2
                AND idempotency_key = $3
            FOR UPDATE
            `,
            [numeroTarjeta, endpoint, idempotencyKey],
        );

        if (existente.rowCount === 0) {
            return {
                tipo: 'CONFLICTO',
                statusCode: 409,
                body: { error: 'No se pudo inicializar la llave de idempotencia' },
            };
        }

        const fila = existente.rows[0]!;

        if (fila.request_hash !== requestHash) {
            return {
                tipo: 'CONFLICTO',
                statusCode: 409,
                body: { error: 'La misma llave de idempotencia no puede usarse con otro payload' },
            };
        }

        if (fila.estado === 'COMPLETADA' && fila.respuesta_http !== null && fila.respuesta_body !== null) {
            return {
                tipo: 'REPLAY',
                statusCode: fila.respuesta_http,
                body: fila.respuesta_body,
            };
        }

        return {
            tipo: 'CONFLICTO',
            statusCode: 409,
            body: { error: 'Solicitud en progreso para esta llave de idempotencia' },
        };
    }

    private async completarIdempotencia(
        client: PoolClient,
        numeroTarjeta: string,
        endpoint: TipoOperacionIdempotente,
        idempotencyKey: string,
        statusCode: number,
        body: unknown,
    ): Promise<void> {
        await client.query(
            `
            UPDATE BancoFuego.IdempotenciaOperacion
            SET estado = 'COMPLETADA',
                respuesta_http = $4,
                respuesta_body = $5::jsonb,
                updated_at = NOW()
            WHERE numero_tarjeta = $1
                AND endpoint = $2
                AND idempotency_key = $3
            `,
            [numeroTarjeta, endpoint, idempotencyKey, statusCode, JSON.stringify(body)],
        );
    }

    private async obtenerCuentaBloqueada(client: PoolClient, idCuenta: number): Promise<FilaCuentaBloqueada | null> {
        const resultado = await client.query<FilaCuentaBloqueada>(
            `
            SELECT c.id_cuenta, c.saldo, c.activa
            FROM BancoFuego.Cuenta c
            WHERE c.id_cuenta = $1
            FOR UPDATE
            `,
            [idCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!;
    }

    private fallido(mensaje: string, statusCode: number): Resultado<ServiceResponse> {
        return ResultadoOperacion.fallido({ mensaje, statusCode });
    }
}

export const operacionesBancariasService = new OperacionesBancariasService();
