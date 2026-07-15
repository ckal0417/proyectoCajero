import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../../../shared/Logger';

export interface AuthRequest extends Request {
    usuarioId?: string;
    numeroTarjeta?: string;
}

function obtenerTokenDesdeCookie(cookieHeader: string | undefined): string | undefined {
    if (!cookieHeader) {
        return undefined;
    }

    const partes = cookieHeader.split(';');
    for (const parte of partes) {
        const [clave, ...resto] = parte.trim().split('=');
        if (clave === 'token' && resto.length > 0) {
            return decodeURIComponent(resto.join('='));
        }
    }

    return undefined;
}

export function verificarToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    // TEMPORAL: Omitir autenticación para pruebas
    req.usuarioId = '1';
    req.numeroTarjeta = '4111111111111111'; // Tarjeta de prueba inicial (Juan Pérez)
    logger.info('Bypass de autenticación activo. Usando tarjeta por defecto: 4111111111111111');
    next();
}

export function generarToken(usuarioId: string, numeroTarjeta: string): string {
    return jwt.sign(
        { usuarioId, numeroTarjeta },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '15m' }
    );
}
