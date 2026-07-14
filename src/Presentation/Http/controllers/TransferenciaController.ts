import type { Request, Response, NextFunction } from 'express';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { Dinero } from '../../../Domain/Value-Objects/Dinero';
import { Cuenta } from '../../../Domain/Entities/Cuenta';

export class TransferenciaController {
    constructor(private readonly cuentaRepo = new CuentaRepositoryPostgres()) {}

    async transferir(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const body = req.body as {
                origenId?: unknown;
                destinoId?: unknown;
                monto?: unknown;
            };
            const origenId = typeof body.origenId === 'number' ? body.origenId : undefined;
            const destinoId = typeof body.destinoId === 'number' ? body.destinoId : undefined;
            const monto = typeof body.monto === 'number' ? body.monto : undefined;

            if (!Number.isInteger(origenId) || !Number.isInteger(destinoId) || typeof monto !== 'number' || monto <= 0) {
                res.status(400).json({ ok: false, error: 'INVALID_REQUEST', message: 'Parámetros inválidos' });
                return;
            }

            if (origenId === destinoId) {
                res.status(400).json({ ok: false, error: 'INVALID_REQUEST', message: 'La cuenta origen y destino deben ser diferentes' });
                return;
            }

            if (origenId === undefined || destinoId === undefined) {
                res.status(400).json({ ok: false, error: 'INVALID_REQUEST', message: 'Parámetros inválidos' });
                return;
            }

            const cuentaOrigen = await this.cuentaRepo.buscarPorId(origenId);
            const cuentaDestino = await this.cuentaRepo.buscarPorId(destinoId);

            if (!cuentaOrigen || !cuentaDestino) {
                res.status(404).json({ ok: false, error: 'CUENTA_NO_ENCONTRADA', message: 'Una o ambas cuentas no existen' });
                return;
            }

            const montoDinero = Dinero.desde(monto);
            const { saldoAnterior: saldoAnteriorOrigen, saldoNuevo: saldoNuevoOrigen } = cuentaOrigen.retirar(montoDinero);
            const { saldoAnterior: saldoAnteriorDestino, saldoNuevo: saldoNuevoDestino } = cuentaDestino.depositar(montoDinero);

            await this.cuentaRepo.actualizar(cuentaOrigen);
            await this.cuentaRepo.actualizar(cuentaDestino);

            res.status(200).json({
                ok: true,
                data: {
                    origen: {
                        id: cuentaOrigen.obtenerId(),
                        saldoAnterior: saldoAnteriorOrigen.toString(),
                        saldoNuevo: saldoNuevoOrigen.toString(),
                    },
                    destino: {
                        id: cuentaDestino.obtenerId(),
                        saldoAnterior: saldoAnteriorDestino.toString(),
                        saldoNuevo: saldoNuevoDestino.toString(),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
