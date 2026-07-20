import { Pool } from 'pg';
import logger from '../../../shared/Logger';
import { Dinero } from '../../../Domain/Value-Objects/Dinero';
import { EventBus } from '../../../shared/events/EventBus';
import { TiposEvento } from '../../../shared/events/TiposEvento';
import { IRedBancariaClient, ResultadoTransferenciaInterbancaria } from '../../Ports/IRedBancariaClient';
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
        private readonly redBancariaClient: IRedBancariaClient,
        private readonly eventBus: EventBus,
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

            if (tipoTransferencia === 'EXTERNA') {
                if (numeroCuentaOrigen === numeroCuentaDestino) {
                    await client.query('ROLLBACK');
                    return this.fallido('La cuenta destino debe ser distinta a la de origen', 400);
                }

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

                const saldoReservado = saldoAnteriorOrigen - montoNumero;

                const referenciaLocal = `EXT-${Date.now()}`;
                const transaccionExterna = await client.query<FilaTransaccion>(
                    `
                    INSERT INTO BancoFuego.Transaccion
                        (tipo, monto, estado, descripcion, referencia_externa, numero_tarjeta_origen, id_cuenta_origen, estado_detalle)
                    VALUES
                        ('TRANSFERENCIA_EXTERNA', $1, 'PENDIENTE', $2, $3, $4, $5, $6)
                    RETURNING id_transaccion
                    `,
                    [
                        montoNumero,
                        `Transferencia externa a ${bancoDestino}, cuenta ${numeroCuentaDestino}`,
                        referenciaLocal,
                        args.numeroTarjeta ?? null,
                        idCuentaOrigen,
                        'Reserva aplicada en cuenta origen',
                    ],
                );

                const idTransaccionExterna = transaccionExterna.rows[0]!.id_transaccion;

                await client.query(
                    `
                    UPDATE BancoFuego.Cuenta
                    SET saldo = $1
                    WHERE id_cuenta = $2
                    `,
                    [saldoReservado, idCuentaOrigen],
                );

                await client.query(
                    `
                    INSERT INTO BancoFuego.Movimiento
                        (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
                    VALUES ('DEBITO', $1, $2, $3, $4, $5)
                    `,
                    [montoNumero, saldoAnteriorOrigen, saldoReservado, idCuentaOrigen, idTransaccionExterna],
                );

                const resultadoRed = await this.redBancariaClient.realizarTransferenciaInterbancaria({
                    bancoOrigen: process.env.BANCO_ORIGEN_NOMBRE ?? 'BancoFuego',
                    bancoDestino,
                    numeroCuentaOrigen,
                    numeroCuentaDestino,
                    montoTransferencia: Dinero.desde(montoNumero),
                    fecha: new Date(),
                });

                const resultadoPersistencia = this.mapearResultadoExterno(resultadoRed, referenciaLocal);
                let saldoDisponible = saldoReservado;
                let reversaAplicada = false;
                let estadoDetalle = resultadoPersistencia.estadoDetalle;

                if (resultadoPersistencia.estadoTransaccion === 'FALLIDA') {
                    saldoDisponible = await this.aplicarReversaExternaTx({
                        client,
                        idCuentaOrigen,
                        montoNumero,
                        idTransaccionExterna,
                        saldoActual: saldoReservado,
                    });
                    reversaAplicada = true;
                    estadoDetalle = `${estadoDetalle}. Reversa aplicada en cuenta origen`;
                }

                await client.query(
                    `
                    UPDATE BancoFuego.Transaccion
                    SET estado = $1,
                        referencia_externa = $2,
                        estado_detalle = $3,
                        updated_at = NOW()
                    WHERE id_transaccion = $4
                    `,
                    [
                        resultadoPersistencia.estadoTransaccion,
                        resultadoPersistencia.referenciaExterna,
                        estadoDetalle,
                        idTransaccionExterna,
                    ],
                );

                const respuestaExterna = {
                    mensaje: resultadoPersistencia.mensaje,
                    estado: resultadoPersistencia.estadoPublico,
                    referenciaExterna: resultadoPersistencia.referenciaExterna,
                    saldoDisponible,
                    reversaAplicada,
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
                        resultadoPersistencia.statusCode,
                        respuestaExterna,
                    );
                }

                await client.query('COMMIT');
                this.publicarEventoTransferenciaExterna({
                    referenciaExterna: resultadoPersistencia.referenciaExterna,
                    estado: resultadoPersistencia.estadoPublico,
                    numeroTarjeta: args.numeroTarjeta,
                    numeroCuentaOrigen,
                    numeroCuentaDestino,
                    monto: montoNumero,
                    reversaAplicada,
                });
                logger.info(
                    `Transferencia externa procesada: estado=${resultadoPersistencia.estadoPublico} referencia=${resultadoPersistencia.referenciaExterna}`,
                );
                return ResultadoOperacion.exitoso({ status: resultadoPersistencia.statusCode, body: respuestaExterna });
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

    private async aplicarReversaExternaTx(args: {
        client: import('pg').PoolClient;
        idCuentaOrigen: number;
        montoNumero: number;
        idTransaccionExterna: number;
        saldoActual: number;
    }): Promise<number> {
        const saldoReversado = args.saldoActual + args.montoNumero;

        await args.client.query(
            `
            UPDATE BancoFuego.Cuenta
            SET saldo = $1
            WHERE id_cuenta = $2
            `,
            [saldoReversado, args.idCuentaOrigen],
        );

        await args.client.query(
            `
            INSERT INTO BancoFuego.Movimiento
                (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
            VALUES ('CREDITO', $1, $2, $3, $4, $5)
            `,
            [args.montoNumero, args.saldoActual, saldoReversado, args.idCuentaOrigen, args.idTransaccionExterna],
        );

        return saldoReversado;
    }

    private publicarEventoTransferenciaExterna(payload: {
        referenciaExterna: string;
        estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
        numeroTarjeta: string | undefined;
        numeroCuentaOrigen: string;
        numeroCuentaDestino: string;
        monto: number;
        reversaAplicada: boolean;
    }): void {
        this.eventBus.publicar({
            nombre: TiposEvento.TRANSFERENCIA_REALIZADA,
            datos: {
                canal: 'INTERBANCARIA',
                referenciaExterna: payload.referenciaExterna,
                estado: payload.estado,
                numeroTarjeta: payload.numeroTarjeta,
                numeroCuentaOrigen: payload.numeroCuentaOrigen,
                numeroCuentaDestino: payload.numeroCuentaDestino,
                monto: payload.monto,
                reversaAplicada: payload.reversaAplicada,
                timestamp: new Date().toISOString(),
            },
        });
    }

    private mapearResultadoExterno(
        resultado: ResultadoTransferenciaInterbancaria,
        referenciaFallback: string,
    ): {
        estadoTransaccion: 'PENDIENTE' | 'EXITOSA' | 'FALLIDA';
        estadoPublico: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
        referenciaExterna: string;
        estadoDetalle: string;
        mensaje: string;
        statusCode: number;
    } {
        if (resultado.estado === 'ACEPTADA') {
            return {
                estadoTransaccion: 'EXITOSA',
                estadoPublico: 'ACEPTADA',
                referenciaExterna: resultado.referencia,
                estadoDetalle: 'Transferencia aceptada por la red bancaria',
                mensaje: 'Transferencia externa aceptada',
                statusCode: 200,
            };
        }

        if (resultado.estado === 'RECHAZADA') {
            return {
                estadoTransaccion: 'FALLIDA',
                estadoPublico: 'RECHAZADA',
                referenciaExterna: referenciaFallback,
                estadoDetalle: `Transferencia rechazada por la red bancaria (${resultado.codigoError})`,
                mensaje: 'Transferencia externa rechazada',
                statusCode: 409,
            };
        }

        return {
            estadoTransaccion: 'PENDIENTE',
            estadoPublico: 'PENDIENTE',
            referenciaExterna: resultado.referenciaExterna,
            estadoDetalle: 'Transferencia pendiente en red bancaria externa',
            mensaje: 'Transferencia externa registrada',
            statusCode: 202,
        };
    }
}
