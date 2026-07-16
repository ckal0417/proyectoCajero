import type { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { operacionesBancariasService } from '../../../Application/services/OperacionesBancariasService';
import { ResultadoOperacion } from '../../../Application/models/Resultado';

export class RetiroController {
    async retirar(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        const idempotencyKey =
            operacionesBancariasService.obtenerIdempotencyKey(authReq.headers['idempotency-key']) ??
            operacionesBancariasService.obtenerIdempotencyKey(authReq.body?.idempotencyKey);

        const resultado = await operacionesBancariasService.retirar({
            numeroTarjeta: authReq.numeroTarjeta,
            idempotencyKey,
            monto: authReq.body?.monto,
        });

        if (!resultado.estado) {
            res.status(ResultadoOperacion.obtenerStatusError(resultado, 400)).json({
                error: ResultadoOperacion.obtenerMensajeError(resultado),
            });
            return;
        }

        res.status(resultado.valor.status).json(resultado.valor.body);
    }
}
