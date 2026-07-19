import { Response } from 'express';
import { operacionesBancariasService } from '../../../Application/services/OperacionesBancariasService';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { ResultadoOperacion } from '../../../Application/models/Resultado';

function adjuntarClienteAutenticado(body: unknown, nombreCliente?: string): unknown {
    if (!nombreCliente || typeof body !== 'object' || body === null) {
        return body;
    }

    return {
        ...body,
        cliente: {
            nombre: nombreCliente,
        },
    };
}

/**
 * GET /operaciones/saldo
 * Obtiene el saldo de la cuenta del usuario autenticado
 */
export async function obtenerSaldoController(req: AuthRequest, res: Response): Promise<void> {
    const resultado = await operacionesBancariasService.obtenerSaldo(req.numeroTarjeta);
    if (!resultado.estado) {
        res.status(ResultadoOperacion.obtenerStatusError(resultado, 400)).json({
            error: ResultadoOperacion.obtenerMensajeError(resultado),
        });
        return;
    }

    res
        .status(resultado.valor.status)
        .json(adjuntarClienteAutenticado(resultado.valor.body, req.nombreCliente));
}

/**
 * GET /operaciones/historial
 * Obtiene el historial de transacciones del usuario autenticado
 */
export async function obtenerHistorialController(req: AuthRequest, res: Response): Promise<void> {
    const resultado = await operacionesBancariasService.obtenerHistorial(req.numeroTarjeta);
    if (!resultado.estado) {
        res.status(ResultadoOperacion.obtenerStatusError(resultado, 400)).json({
            error: ResultadoOperacion.obtenerMensajeError(resultado),
        });
        return;
    }

    res
        .status(resultado.valor.status)
        .json(adjuntarClienteAutenticado(resultado.valor.body, req.nombreCliente));
}
