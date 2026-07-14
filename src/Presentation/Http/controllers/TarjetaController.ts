import type { Request, Response } from 'express';
import { TarjetaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { NumeroTarjeta } from '../../../Domain/Value-Objects/NumeroTarjeta';

export class TarjetaController {
    constructor(private readonly tarjetaRepo = new TarjetaRepositoryPostgres()) {}

    async estado(req: Request, res: Response): Promise<void> {
        try {
            const numeroTarjeta = req.params.numeroTarjeta;
            if (typeof numeroTarjeta !== 'string' || numeroTarjeta.length === 0) {
                res.status(400).json({ ok: false, error: 'INVALID_CARD', message: 'Número de tarjeta inválido' });
                return;
            }
            const tarjeta = await this.tarjetaRepo.buscarPorNumero(NumeroTarjeta.desde(numeroTarjeta));
            if (!tarjeta) {
                res.status(404).json({ ok: false, error: 'TARJETA_NO_ENCONTRADA', message: 'Tarjeta no encontrada' });
                return;
            }

            res.status(200).json({
                ok: true,
                data: {
                    activa: tarjeta.estaActiva(),
                    idCuenta: tarjeta.obtenerIdCuenta(),
                },
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ ok: false, error: 'INVALID_CARD', message: error.message });
                return;
            }
            res.status(500).json({ ok: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error inesperado' });
        }
    }
}
