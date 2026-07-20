import logger from '../../shared/Logger';
import { TransferenciaExternaEstadoService } from '../../Application/services/operaciones/TransferenciaExternaEstadoService';

export class TransferenciaExternaPollingWorker {
    private timer: NodeJS.Timeout | null = null;

    constructor(
        private readonly service: TransferenciaExternaEstadoService,
        private readonly intervaloMs: number,
        private readonly loteMaximo: number,
    ) { }

    iniciar(): void {
        if (this.timer) {
            return;
        }

        this.timer = setInterval(() => {
            this.ejecutarCiclo().catch((error) => {
                logger.warn(`Error en ciclo de polling de transferencias externas: ${String(error)}`);
            });
        }, this.intervaloMs);

        logger.info(`Worker de transferencias externas iniciado cada ${this.intervaloMs}ms (lote ${this.loteMaximo})`);
    }

    detener(): void {
        if (!this.timer) {
            return;
        }

        clearInterval(this.timer);
        this.timer = null;
        logger.info('Worker de transferencias externas detenido');
    }

    async ejecutarCiclo(): Promise<void> {
        const actualizadas = await this.service.sincronizarPendientes(this.loteMaximo);
        if (actualizadas > 0) {
            logger.info(`Polling de transferencias externas actualizo ${actualizadas} registro(s)`);
        }
    }
}
