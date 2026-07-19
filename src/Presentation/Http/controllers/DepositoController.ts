import type { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { operacionesBancariasService } from '../../../bootstrap/services';
import { ResultadoOperacion } from '../../../Application/models/Resultado';

export class DepositoController {
    async depositar(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        const idempotencyKey =
            operacionesBancariasService.obtenerIdempotencyKey(authReq.headers['idempotency-key']) ??
            operacionesBancariasService.obtenerIdempotencyKey(authReq.body?.idempotencyKey);

        const resultado = await operacionesBancariasService.depositar({
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

        const body =
            authReq.nombreCliente && typeof resultado.valor.body === 'object' && resultado.valor.body !== null
                ? {
                    ...resultado.valor.body,
                    cliente: {
                        nombre: authReq.nombreCliente,
                    },
                }
                : resultado.valor.body;

        res.status(resultado.valor.status).json(body);
    }
}
