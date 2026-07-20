import { Pool } from 'pg';
import logger from '../../../shared/Logger';
import { EventBus } from '../../../shared/events/EventBus';
import { TiposEvento } from '../../../shared/events/TiposEvento';
import { IRedBancariaClient, ResultadoTransferenciaInterbancaria } from '../../Ports/IRedBancariaClient';
import { Resultado, ResultadoOperacion } from '../../models/Resultado';
import { ServiceResponse } from './types';

interface FilaTransaccionExterna {
    id_transaccion: number;
    estado: 'PENDIENTE' | 'EXITOSA' | 'FALLIDA' | 'CANCELADA';
    monto: string;
    referencia_externa: string;
    numero_tarjeta_origen: string | null;
    id_cuenta_origen: number | null;
    estado_detalle: string | null;
    updated_at: Date | null;
}

export class TransferenciaExternaEstadoService {
    constructor(
        private readonly pool: Pool,
        private readonly redBancariaClient: IRedBancariaClient,
        private readonly eventBus: EventBus,
    ) { }

    async consultarEstadoPorReferencia(
        referenciaExterna: string,
        numeroTarjetaAutenticada: string,
    ): Promise<Resultado<ServiceResponse>> {
        const referencia = referenciaExterna.trim();
        if (!referencia) {
            return this.fallido('Referencia externa requerida', 400);
        }

        const numeroTarjeta = numeroTarjetaAutenticada.trim();
        if (!numeroTarjeta) {
            return this.fallido('No autorizado', 401);
        }

        const transaccion = await this.obtenerPorReferencia(referencia, numeroTarjeta);
        if (!transaccion) {
            return this.fallido('Transferencia externa no encontrada', 404);
        }

        if (transaccion.estado === 'PENDIENTE') {
            const externo = await this.redBancariaClient.consultarEstado(transaccion.referencia_externa);
            const actualizado = await this.aplicarResultadoExterno(transaccion, externo);
            return ResultadoOperacion.exitoso({
                status: 200,
                body: this.aRespuestaEstado(actualizado),
            });
        }

        return ResultadoOperacion.exitoso({
            status: 200,
            body: this.aRespuestaEstado(transaccion),
        });
    }

    async sincronizarPendientes(maximo: number = 50): Promise<number> {
        const pendientes = await this.obtenerPendientes(maximo);
        if (pendientes.length === 0) {
            return 0;
        }

        let actualizadas = 0;

        for (const pendiente of pendientes) {
            try {
                const externo = await this.redBancariaClient.consultarEstado(pendiente.referencia_externa);
                const actualizado = await this.aplicarResultadoExterno(pendiente, externo);
                if (actualizado.estado !== 'PENDIENTE') {
                    actualizadas += 1;
                }
            } catch (error) {
                logger.warn(`No se pudo sincronizar referencia externa ${pendiente.referencia_externa}: ${String(error)}`);
            }
        }

        return actualizadas;
    }

    private async obtenerPorReferencia(
        referenciaExterna: string,
        numeroTarjetaAutenticada: string,
    ): Promise<FilaTransaccionExterna | null> {
        const resultado = await this.pool.query<FilaTransaccionExterna>(
            `
            SELECT id_transaccion, estado, monto, referencia_externa, numero_tarjeta_origen, id_cuenta_origen, estado_detalle, updated_at
            FROM BancoFuego.Transaccion
            WHERE tipo = 'TRANSFERENCIA_EXTERNA'
            AND referencia_externa = $1
            AND numero_tarjeta_origen = $2
            ORDER BY id_transaccion DESC
            LIMIT 1
            `,
            [referenciaExterna, numeroTarjetaAutenticada],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!;
    }

    private async obtenerPendientes(maximo: number): Promise<FilaTransaccionExterna[]> {
        const resultado = await this.pool.query<FilaTransaccionExterna>(
            `
            SELECT id_transaccion, estado, monto, referencia_externa, numero_tarjeta_origen, id_cuenta_origen, estado_detalle, updated_at
            FROM BancoFuego.Transaccion
            WHERE tipo = 'TRANSFERENCIA_EXTERNA'
            AND estado = 'PENDIENTE'
            AND referencia_externa IS NOT NULL
            ORDER BY updated_at ASC NULLS FIRST, id_transaccion ASC
            LIMIT $1
            `,
            [maximo],
        );

        return resultado.rows;
    }

    private async aplicarResultadoExterno(
        transaccion: FilaTransaccionExterna,
        resultadoExterno: ResultadoTransferenciaInterbancaria,
    ): Promise<FilaTransaccionExterna> {
        const mapeo = this.mapearResultadoExterno(resultadoExterno, transaccion.referencia_externa);
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const bloqueada = await client.query<FilaTransaccionExterna>(
                `
                SELECT id_transaccion, estado, monto, referencia_externa, numero_tarjeta_origen, id_cuenta_origen, estado_detalle, updated_at
                FROM BancoFuego.Transaccion
                WHERE id_transaccion = $1
                FOR UPDATE
                `,
                [transaccion.id_transaccion],
            );

            if (bloqueada.rowCount === 0) {
                await client.query('ROLLBACK');
                return transaccion;
            }

            const actual = bloqueada.rows[0]!;
            if (actual.estado !== 'PENDIENTE') {
                await client.query('COMMIT');
                return actual;
            }

            let reversaAplicada = false;
            let estadoDetalleFinal = mapeo.estadoDetalle;

            if (mapeo.estado === 'FALLIDA' && actual.id_cuenta_origen !== null) {
                reversaAplicada = await this.aplicarReversaPendienteTx(client, actual);
                if (reversaAplicada) {
                    estadoDetalleFinal = `${estadoDetalleFinal}. Reversa aplicada en cuenta origen`;
                }
            }

            const actualizado = await client.query<FilaTransaccionExterna>(
                `
                UPDATE BancoFuego.Transaccion
                SET estado = $1,
                    referencia_externa = $2,
                    estado_detalle = $3,
                    updated_at = NOW()
                WHERE id_transaccion = $4
                RETURNING id_transaccion, estado, monto, referencia_externa, numero_tarjeta_origen, id_cuenta_origen, estado_detalle, updated_at
                `,
                [
                    mapeo.estado,
                    mapeo.referenciaExterna,
                    estadoDetalleFinal,
                    actual.id_transaccion,
                ],
            );

            const final = actualizado.rows[0]!;
            await client.query('COMMIT');

            if (final.estado === 'EXITOSA' || final.estado === 'FALLIDA') {
                this.publicarEventoCambioEstado(final, reversaAplicada);
            }

            return final;
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Ignore rollback errors and keep original error.
            }
            throw error;
        } finally {
            client.release();
        }
    }

    private async aplicarReversaPendienteTx(
        client: import('pg').PoolClient,
        transaccion: FilaTransaccionExterna,
    ): Promise<boolean> {
        if (transaccion.id_cuenta_origen === null) {
            return false;
        }

        const cuenta = await client.query<{ saldo: string }>(
            `
            SELECT saldo
            FROM BancoFuego.Cuenta
            WHERE id_cuenta = $1
            FOR UPDATE
            `,
            [transaccion.id_cuenta_origen],
        );

        if (cuenta.rowCount === 0) {
            return false;
        }

        const saldoAnterior = Number(cuenta.rows[0]!.saldo);
        const monto = Number(transaccion.monto);
        const saldoNuevo = saldoAnterior + monto;

        await client.query(
            `
            UPDATE BancoFuego.Cuenta
            SET saldo = $1
            WHERE id_cuenta = $2
            `,
            [saldoNuevo, transaccion.id_cuenta_origen],
        );

        await client.query(
            `
            INSERT INTO BancoFuego.Movimiento
                (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
            VALUES ('CREDITO', $1, $2, $3, $4, $5)
            `,
            [monto, saldoAnterior, saldoNuevo, transaccion.id_cuenta_origen, transaccion.id_transaccion],
        );

        return true;
    }

    private mapearResultadoExterno(
        resultadoExterno: ResultadoTransferenciaInterbancaria,
        referenciaActual: string,
    ): {
        estado: 'PENDIENTE' | 'EXITOSA' | 'FALLIDA';
        referenciaExterna: string;
        estadoDetalle: string;
    } {
        if (resultadoExterno.estado === 'ACEPTADA') {
            return {
                estado: 'EXITOSA',
                referenciaExterna: resultadoExterno.referencia,
                estadoDetalle: 'Transferencia aceptada por la red bancaria',
            };
        }

        if (resultadoExterno.estado === 'RECHAZADA') {
            return {
                estado: 'FALLIDA',
                referenciaExterna: referenciaActual,
                estadoDetalle: `Transferencia rechazada por la red bancaria (${resultadoExterno.codigoError})`,
            };
        }

        return {
            estado: 'PENDIENTE',
            referenciaExterna: resultadoExterno.referenciaExterna,
            estadoDetalle: 'Transferencia pendiente en red bancaria externa',
        };
    }

    private aRespuestaEstado(transaccion: FilaTransaccionExterna): {
        referenciaExterna: string;
        estado: string;
        estadoDetalle: string | null;
        actualizadoEn: string | null;
    } {
        return {
            referenciaExterna: transaccion.referencia_externa,
            estado: transaccion.estado,
            estadoDetalle: transaccion.estado_detalle,
            actualizadoEn: transaccion.updated_at ? transaccion.updated_at.toISOString() : null,
        };
    }

    private fallido(mensaje: string, statusCode: number): Resultado<ServiceResponse> {
        return ResultadoOperacion.fallido({ mensaje, statusCode });
    }

    private publicarEventoCambioEstado(transaccion: FilaTransaccionExterna, reversaAplicada: boolean): void {
        this.eventBus.publicar({
            nombre: TiposEvento.TRANSFERENCIA_REALIZADA,
            datos: {
                canal: 'INTERBANCARIA',
                referenciaExterna: transaccion.referencia_externa,
                estado: transaccion.estado,
                numeroTarjeta: transaccion.numero_tarjeta_origen,
                monto: Number(transaccion.monto),
                reversaAplicada,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
