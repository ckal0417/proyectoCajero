import type { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { operacionesBancariasService } from '../../../Application/services/OperacionesBancariasService';

export class DepositoController {
    async depositar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const resultado = await operacionesBancariasService.depositar({
                numeroTarjeta: authReq.numeroTarjeta,
                idempotencyKey: operacionesBancariasService.obtenerIdempotencyKey(authReq.headers['idempotency-key']),
                monto: authReq.body?.monto,
            });

            res.status(resultado.status).json(resultado.body);
        } catch (error) {
            next(error);
        }
    }
}
