// Unused controller. Commented out because RetirarDineroService is missing.
/*
import type { Request, Response, NextFunction } from 'express';
import { RetirarDineroService } from '../../../Application/services/operaciones/retiro/RetirarDineroService';
import { TarjetaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { TransaccionRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/TransaccionRepositoryPostgres';
import { MovimientoRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/MovimientoRepositoryPostgres';
import { PinHasherBcrypt } from '../../../Infrastructure/Persistence/PinHasherBcrypt';

export class RetiroController {
    private readonly service: RetirarDineroService;

    constructor() {
        this.service = new RetirarDineroService(
            new TarjetaRepositoryPostgres(),
            new AutenticacionRepositoryPostgres(),
            new CuentaRepositoryPostgres(),
            new TransaccionRepositoryPostgres(),
            new MovimientoRepositoryPostgres(),
            new PinHasherBcrypt(),
        );
    }

    async retirar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { numeroTarjeta, pin, monto, idCajero } = req.body as {
                numeroTarjeta?: string;
                pin?: string;
                monto?: number;
                idCajero?: number;
            };

            if (!numeroTarjeta || !pin || typeof monto !== 'number' || typeof idCajero !== 'number' || !Number.isInteger(idCajero)) {
                res.status(400).json({ ok: false, error: 'INVALID_REQUEST', message: 'Faltan campos requeridos' });
                return;
            }

            const resultado = await this.service.ejecutar({
                numeroTarjeta,
                pin,
                monto,
                idCajero,
            });

            res.status(200).json({
                ok: true,
                data: {
                    saldoNuevo: resultado.saldoNuevo.toString(),
                    transaccionId: resultado.transaccion.obtenerId(),
                    movimientoId: resultado.movimiento.obtenerId(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
*/
