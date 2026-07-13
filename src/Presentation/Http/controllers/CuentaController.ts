import { CuentaRepositoryPostgres } from "../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres";
import type { Request, Response } from 'express';

export class CuentaController {
    constructor(private readonly cuentaRepo = new CuentaRepositoryPostgres()) {}

    async obtenerCuenta(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            res.status(400).json({ ok: false, error: 'INVALID_ID', message: 'El id de cuenta debe ser un número entero' });
            return;
        }

        const cuenta = await this.cuentaRepo.buscarPorId(id);
        if (!cuenta) {
            res.status(404).json({ ok: false, error: 'CUENTA_NO_ENCONTRADA', message: 'Cuenta no encontrada' });
            return;
        }

        res.status(200).json({
            ok: true,
            data: {
                id: cuenta.obtenerId(),
                numeroCuenta: cuenta.obtenerNumeroCuenta().toString(),
                tipo: cuenta.obtenerTipo(),
                saldo: cuenta.obtenerSaldo().toString(),
                activa: cuenta.estaActiva(),
            },
        });
    }
}
