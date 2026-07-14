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
    const tokenHeader = req.headers.authorization?.split(' ')[1];
    const tokenCookie = obtenerTokenDesdeCookie(req.headers.cookie);
    const token = tokenHeader || tokenCookie;

    if (!token) {
        logger.warn('Intento de acceso sin token');
        res.status(401).json({ error: 'Token no proporcionado' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as {
            usuarioId: string;
            numeroTarjeta: string;
        };
        req.usuarioId = decoded.usuarioId;
        req.numeroTarjeta = decoded.numeroTarjeta;
        next();
    } catch (error) {
        logger.warn('Token inválido o expirado');
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

export function generarToken(usuarioId: string, numeroTarjeta: string): string {
    return jwt.sign(
        { usuarioId, numeroTarjeta },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '24h' }
    );
}
