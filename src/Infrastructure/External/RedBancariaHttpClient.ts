import {
    IRedBancariaClient,
    ResultadoTransferenciaInterbancaria,
    SolicitudTransferenciaInterbancaria,
} from '../../Application/Ports/IRedBancariaClient';
import logger from '../../shared/Logger';

interface RespuestaRedBancaria {
    estado?: string;
    referencia?: string;
    referenciaExterna?: string;
    codigoError?: string;
}

export class RedBancariaHttpClient implements IRedBancariaClient {
    constructor(
        private readonly baseUrl: string | null,
        private readonly timeoutMs: number = 5000,
        private readonly maxRetries: number = 2,
        private readonly retryBaseDelayMs: number = 300,
        private readonly apiKey?: string,
    ) { }

    static desdeEnv(): RedBancariaHttpClient {
        const baseUrl = process.env.RED_BANCARIA_BASE_URL?.trim() || null;
        const timeoutMs = Number(process.env.RED_BANCARIA_TIMEOUT_MS ?? 5000);
        const maxRetries = Number(process.env.RED_BANCARIA_MAX_RETRIES ?? 2);
        const retryBaseDelayMs = Number(process.env.RED_BANCARIA_RETRY_BASE_DELAY_MS ?? 300);
        const apiKey = process.env.RED_BANCARIA_API_KEY;

        return new RedBancariaHttpClient(
            baseUrl,
            Number.isFinite(timeoutMs) ? timeoutMs : 5000,
            Number.isFinite(maxRetries) ? maxRetries : 2,
            Number.isFinite(retryBaseDelayMs) ? retryBaseDelayMs : 300,
            apiKey,
        );
    }

    async realizarTransferenciaInterbancaria(
        solicitud: SolicitudTransferenciaInterbancaria,
    ): Promise<ResultadoTransferenciaInterbancaria> {
        if (!this.baseUrl) {
            const referenciaExterna = `SIM-${Date.now()}`;
            logger.warn('RED_BANCARIA_BASE_URL no configurado; transferencia externa queda PENDIENTE simulada.');
            return { estado: 'PENDIENTE', referenciaExterna };
        }

        const respuesta = await this.postJson('/transferencias/interbancarias', {
            bancoOrigen: solicitud.bancoOrigen,
            bancoDestino: solicitud.bancoDestino,
            numeroCuentaOrigen: solicitud.numeroCuentaOrigen,
            numeroCuentaDestino: solicitud.numeroCuentaDestino,
            montoTransferencia: solicitud.montoTransferencia.toNumber(),
            fecha: solicitud.fecha.toISOString(),
        });

        return this.mapearRespuesta(respuesta);
    }

    async consultarEstado(referenciaExterna: string): Promise<ResultadoTransferenciaInterbancaria> {
        if (!this.baseUrl) {
            return { estado: 'PENDIENTE', referenciaExterna };
        }

        const respuesta = await this.getJson(`/transferencias/interbancarias/${encodeURIComponent(referenciaExterna)}`);
        return this.mapearRespuesta(respuesta);
    }

    private async postJson(path: string, payload: unknown): Promise<RespuestaRedBancaria> {
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: this.construirHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                return { estado: 'RECHAZADA', codigoError: `HTTP_${response.status}` };
            }

            return await this.parseJson(response);
        } catch (error) {
            logger.warn(`Error de integracion al enviar transferencia externa: ${String(error)}`);
            return { estado: 'PENDIENTE', referenciaExterna: `PEND-${Date.now()}` };
        }
    }

    private async getJson(path: string): Promise<RespuestaRedBancaria> {
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}${path}`, {
                method: 'GET',
                headers: this.construirHeaders(),
            });

            if (!response.ok) {
                return { estado: 'RECHAZADA', codigoError: `HTTP_${response.status}` };
            }

            return await this.parseJson(response);
        } catch (error) {
            logger.warn(`Error consultando estado de transferencia externa: ${String(error)}`);
            return { estado: 'PENDIENTE', referenciaExterna: path.split('/').pop() ?? `PEND-${Date.now()}` };
        }
    }

    private construirHeaders(): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        return headers;
    }

    private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            return await fetch(url, {
                ...init,
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }
    }

    private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
        let ultimoError: unknown;

        for (let intento = 0; intento <= this.maxRetries; intento += 1) {
            try {
                const response = await this.fetchWithTimeout(url, init);

                if (response.ok) {
                    return response;
                }

                if (!this.esReintentableStatus(response.status) || intento === this.maxRetries) {
                    return response;
                }

                await this.delay(this.retryBaseDelayMs * (intento + 1));
            } catch (error) {
                ultimoError = error;

                if (intento === this.maxRetries) {
                    throw error;
                }

                await this.delay(this.retryBaseDelayMs * (intento + 1));
            }
        }

        throw ultimoError instanceof Error ? ultimoError : new Error('Fallo de red bancaria sin detalle');
    }

    private esReintentableStatus(statusCode: number): boolean {
        return statusCode === 429 || statusCode >= 500;
    }

    private async delay(ms: number): Promise<void> {
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }

    private async parseJson(response: Response): Promise<RespuestaRedBancaria> {
        const body = await response.json() as RespuestaRedBancaria;
        return body ?? {};
    }

    private mapearRespuesta(respuesta: RespuestaRedBancaria): ResultadoTransferenciaInterbancaria {
        const estado = (respuesta.estado ?? '').toUpperCase();

        if (estado === 'ACEPTADA') {
            return {
                estado: 'ACEPTADA',
                referencia: respuesta.referencia ?? respuesta.referenciaExterna ?? `ACC-${Date.now()}`,
            };
        }

        if (estado === 'RECHAZADA') {
            return {
                estado: 'RECHAZADA',
                codigoError: respuesta.codigoError ?? 'RECHAZADA_POR_RED',
            };
        }

        return {
            estado: 'PENDIENTE',
            referenciaExterna: respuesta.referenciaExterna ?? respuesta.referencia ?? `PEND-${Date.now()}`,
        };
    }
}
