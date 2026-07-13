import type { Request, Response, NextFunction } from 'express';

export function validateBody(requiredFields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const body = req.body ?? {};
        const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
        if (missing.length > 0) {
            res.status(400).json({
                ok: false,
                error: 'INVALID_REQUEST',
                message: `Faltan campos requeridos: ${missing.join(', ')}`,
            });
            return;
        }
        next();
    };
}

export function validateParams(requiredFields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const params = req.params ?? {};
        const missing = requiredFields.filter((field) => params[field] === undefined || params[field] === null || params[field] === '');
        if (missing.length > 0) {
            res.status(400).json({
                ok: false,
                error: 'INVALID_PARAMS',
                message: `Faltan parámetros requeridos: ${missing.join(', ')}`,
            });
            return;
        }
        next();
    };
}
