import type { NextFunction, Request, Response } from 'express';
import { DomainError } from "../../shared/Errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof DomainError) {
        res.status(err.statusCode).json({
            ok: false,
            error: err.code,
            message: err.message,
        });
        return;
    }

    if (err instanceof Error) {
        res.status(500).json({
            ok: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: err.message,
        });
        return;
    }

    res.status(500).json({
        ok: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error inesperado',
    });
}
