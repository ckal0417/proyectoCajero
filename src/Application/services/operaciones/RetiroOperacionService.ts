import { Pool } from 'pg';
import logger from '../../../shared/Logger';
import { Resultado, ResultadoOperacion } from '../../models/Resultado';
import { CuentaOperacionQueryService } from './CuentaOperacionQueryService';
import { IdempotenciaService } from './IdempotenciaService';
import { ServiceResponse } from './types';

interface FilaTransaccion {
    id_transaccion: number;
}

export class RetiroOperacionService {
    constructor(
        private readonly pool: Pool,
        private readonly cuentaQueryService: CuentaOperacionQueryService,
        private readonly idempotenciaService: IdempotenciaService,
    ) { }

    async ejecutar(args: {
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
                const requestHash = this.idempotenciaService.crearHashOperacion({
                    numeroTarjeta: args.numeroTarjeta,
                    monto: montoNumero,
                    endpoint: 'RETIRO',
                });

                const estadoIdempotencia = await this.idempotenciaService.iniciar(
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

            const idCuenta = await this.cuentaQueryService.obtenerIdCuentaPorTarjetaTx(client, args.numeroTarjeta);

            if (idCuenta === null) {
                await client.query('ROLLBACK');
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuenta = await this.cuentaQueryService.obtenerCuentaBloqueada(client, idCuenta);

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
                await this.idempotenciaService.completar(
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

    private fallido(mensaje: string, statusCode: number): Resultado<ServiceResponse> {
        return ResultadoOperacion.fallido({ mensaje, statusCode });
    }
}
