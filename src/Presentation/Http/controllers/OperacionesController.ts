import { Response } from 'express';
import { operacionesBancariasService } from '../../../Application/services/OperacionesBancariasService';
import { AuthRequest } from '../middleware/AuthMiddleware';

/**
 * GET /operaciones/saldo
 * Obtiene el saldo de la cuenta del usuario autenticado
 */
export async function obtenerSaldoController(req: AuthRequest, res: Response): Promise<void> {
    const resultado = await operacionesBancariasService.obtenerSaldo(req.numeroTarjeta);
    res.status(resultado.status).json(resultado.body);
}

/**
 * GET /operaciones/historial
 * Obtiene el historial de transacciones del usuario autenticado
 */
export async function obtenerHistorialController(req: AuthRequest, res: Response): Promise<void> {
    const resultado = await operacionesBancariasService.obtenerHistorial(req.numeroTarjeta);
    res.status(resultado.status).json(resultado.body);
}
