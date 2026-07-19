import { Pool } from 'pg';
import logger from '../../../shared/Logger';
import { Resultado, ResultadoOperacion } from '../../models/Resultado';
import { CuentaOperacionQueryService } from './CuentaOperacionQueryService';
import { IdempotenciaService } from './IdempotenciaService';
import { ServiceResponse } from './types';

interface FilaTransaccion {
    id_transaccion: number;
}

export class TransferenciaOperacionService {
    constructor(
        private readonly pool: Pool,
        private readonly cuentaQueryService: CuentaOperacionQueryService,
        private readonly idempotenciaService: IdempotenciaService,
    ) { }

    async ejecutar(args: {
        numeroTarjeta: string | undefined;
        numeroCuentaOrigen?: string;
        idempotencyKey?: string | null;
        tipoTransferencia?: 'INTERNA' | 'EXTERNA';
        bancoDestino?: string;
        numeroCuentaDestino: unknown;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        const client = await this.pool.connect();
        try {
            if (!args.numeroTarjeta && !args.numeroCuentaOrigen) {
                return this.fallido('No autorizado', 401);
            }

            const idempotencyKey = args.idempotencyKey ?? null;
            const tipoTransferencia = args.tipoTransferencia ?? 'INTERNA';
            const bancoDestino = String(args.bancoDestino ?? '').trim();

            const numeroCuentaDestino = String(args.numeroCuentaDestino ?? '');
            const montoNumero = Number(args.monto);

            if (!numeroCuentaDestino || !Number.isFinite(montoNumero) || montoNumero <= 0) {
                return this.fallido('numeroCuentaDestino y monto (mayor a 0) son requeridos', 400);
            }

            if (tipoTransferencia === 'EXTERNA' && bancoDestino.length === 0) {
                return this.fallido('bancoDestino es requerido para transferencia externa', 400);
            }

            await client.query('BEGIN');

            if (idempotencyKey && args.numeroTarjeta) {
                const requestHash = this.idempotenciaService.crearHashOperacion({
                    numeroTarjeta: args.numeroTarjeta,
                    tipoTransferencia,
                    bancoDestino,
                    numeroCuentaDestino,
                    monto: montoNumero,
                    endpoint: 'TRANSFERENCIA',
                });

                const estadoIdempotencia = await this.idempotenciaService.iniciar(
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

            const idCuentaOrigen = await this.obtenerIdCuentaOrigen(client, args.numeroTarjeta, args.numeroCuentaOrigen);
            if (idCuentaOrigen === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta origen no encontrada', 404);
            }

            const numeroCuentaOrigen = await this.cuentaQueryService.obtenerNumeroCuentaPorIdTx(client, idCuentaOrigen);
            if (numeroCuentaOrigen === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta origen no encontrada', 404);
            }

            const idCuentaDestino = await this.cuentaQueryService.obtenerIdCuentaPorNumeroTx(client, numeroCuentaDestino);
            if (idCuentaDestino === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta destino no encontrada', 404);
            }

            if (idCuentaOrigen === idCuentaDestino) {
                await client.query('ROLLBACK');
                return this.fallido('La cuenta destino debe ser distinta a la de origen', 400);
            }

            if (tipoTransferencia === 'EXTERNA') {
                const cuentaOrigenBloqueada = await this.cuentaQueryService.obtenerCuentaBloqueada(client, idCuentaOrigen);
                if (!cuentaOrigenBloqueada) {
                    await client.query('ROLLBACK');
                    return this.fallido('Cuenta origen no encontrada', 404);
                }

                if (!cuentaOrigenBloqueada.activa) {
                    await client.query('ROLLBACK');
                    return this.fallido('Cuenta origen no activa', 409);
                }

                const saldoAnteriorOrigen = Number(cuentaOrigenBloqueada.saldo);
                if (saldoAnteriorOrigen < montoNumero) {
                    await client.query('ROLLBACK');
                    return this.fallido('Fondos insuficientes', 400);
                }

                const referenciaExterna = `EXT-${Date.now()}`;

                await client.query(
                    `
                    INSERT INTO BancoFuego.Transaccion
                        (tipo, monto, estado, descripcion, referencia_externa)
                    VALUES
                        ('TRANSFERENCIA_EXTERNA', $1, 'PENDIENTE', $2, $3)
                    `,
                    [montoNumero, `Transferencia externa a ${bancoDestino}, cuenta ${numeroCuentaDestino}`, referenciaExterna],
                );

                const respuestaExterna = {
                    mensaje: 'Transferencia externa registrada',
                    estado: 'PENDIENTE',
                    referenciaExterna,
                    bancoDestino,
                    numeroCuentaOrigen,
                    numeroCuentaDestino,
                };

                if (idempotencyKey && args.numeroTarjeta) {
                    await this.idempotenciaService.completar(
                        client,
                        args.numeroTarjeta,
                        'TRANSFERENCIA',
                        idempotencyKey,
                        202,
                        respuestaExterna,
                    );
                }

                await client.query('COMMIT');
                logger.info(
                    `Transferencia externa registrada: $${montoNumero} desde cuenta ${numeroCuentaOrigen} a ${bancoDestino}/${numeroCuentaDestino}`,
                );
                return ResultadoOperacion.exitoso({ status: 202, body: respuestaExterna });
            }

            const cuentasBloqueadas = await this.cuentaQueryService.obtenerCuentasBloqueadasPorIds(client, [
                idCuentaOrigen,
                idCuentaDestino,
            ]);

            if (cuentasBloqueadas.length !== 2) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuentaOrigen = cuentasBloqueadas.find((fila) => fila.id_cuenta === idCuentaOrigen);
            const cuentaDestino = cuentasBloqueadas.find((fila) => fila.id_cuenta === idCuentaDestino);

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

            if (idempotencyKey && args.numeroTarjeta) {
                await this.idempotenciaService.completar(
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

    private fallido(mensaje: string, statusCode: number): Resultado<ServiceResponse> {
        return ResultadoOperacion.fallido({ mensaje, statusCode });
    }

    private async obtenerIdCuentaOrigen(
        client: import('pg').PoolClient,
        numeroTarjeta: string | undefined,
        numeroCuentaOrigen?: string,
    ): Promise<number | null> {
        if (numeroTarjeta) {
            return this.cuentaQueryService.obtenerIdCuentaPorTarjetaTx(client, numeroTarjeta);
        }

        if (!numeroCuentaOrigen) {
            return null;
        }

        return this.cuentaQueryService.obtenerIdCuentaPorNumeroTx(client, numeroCuentaOrigen);
    }
}
