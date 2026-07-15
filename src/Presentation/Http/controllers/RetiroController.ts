import type { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { operacionesBancariasService } from '../../../Application/services/OperacionesBancariasService';

export class RetiroController {
    async retirar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const resultado = await operacionesBancariasService.retirar({
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
