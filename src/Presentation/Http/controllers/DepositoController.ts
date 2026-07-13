import type { Request, Response, NextFunction } from 'express';
import { Dinero } from '../../../Domain/Value-Objects/Dinero';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';

export class DepositoController {
    constructor(private readonly cuentaRepo = new CuentaRepositoryPostgres()) {}

    async depositar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const monto = Number(req.body?.monto);
            if (!Number.isInteger(id) || !Number.isFinite(monto) || monto <= 0) {
                res.status(400).json({ ok: false, error: 'INVALID_REQUEST', message: 'Parámetros inválidos' });
                return;
            }

            const cuenta = await this.cuentaRepo.buscarPorId(id);
            if (!cuenta) {
                res.status(404).json({ ok: false, error: 'CUENTA_NO_ENCONTRADA', message: 'Cuenta no encontrada' });
                return;
            }

            const { saldoAnterior, saldoNuevo } = cuenta.depositar(Dinero.desde(monto));
            await this.cuentaRepo.actualizar(cuenta);

            res.status(200).json({
                ok: true,
                data: {
                    saldoAnterior: saldoAnterior.toString(),
                    saldoNuevo: saldoNuevo.toString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
