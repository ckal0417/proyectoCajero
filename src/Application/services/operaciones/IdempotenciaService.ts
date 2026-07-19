import { createHash } from 'crypto';
import { PoolClient } from 'pg';
import { EstadoIdempotencia, TipoOperacionIdempotente } from './types';

interface FilaIdempotencia {
    request_hash: string;
    estado: 'EN_PROCESO' | 'COMPLETADA';
    respuesta_http: number | null;
    respuesta_body: unknown;
}

export class IdempotenciaService {
    crearHashOperacion(payload: unknown): string {
        return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    }

    async iniciar(
        client: PoolClient,
        numeroTarjeta: string,
        endpoint: TipoOperacionIdempotente,
        idempotencyKey: string,
        requestHash: string,
    ): Promise<EstadoIdempotencia> {
        const insercion = await client.query<{ id_idempotencia: number }>(
            `
            INSERT INTO BancoFuego.IdempotenciaOperacion
                (numero_tarjeta, endpoint, idempotency_key, request_hash, estado)
            VALUES ($1, $2, $3, $4, 'EN_PROCESO')
            ON CONFLICT (numero_tarjeta, endpoint, idempotency_key) DO NOTHING
            RETURNING id_idempotencia
            `,
            [numeroTarjeta, endpoint, idempotencyKey, requestHash],
        );

        if (insercion.rowCount === 1) {
            return { tipo: 'NUEVA' };
        }

        const existente = await client.query<FilaIdempotencia>(
            `
            SELECT request_hash, estado, respuesta_http, respuesta_body
            FROM BancoFuego.IdempotenciaOperacion
            WHERE numero_tarjeta = $1
                AND endpoint = $2
                AND idempotency_key = $3
            FOR UPDATE
            `,
            [numeroTarjeta, endpoint, idempotencyKey],
        );

        if (existente.rowCount === 0) {
            return {
                tipo: 'CONFLICTO',
                statusCode: 409,
                body: { error: 'No se pudo inicializar la llave de idempotencia' },
            };
        }

        const fila = existente.rows[0]!;

        if (fila.request_hash !== requestHash) {
            return {
                tipo: 'CONFLICTO',
                statusCode: 409,
                body: { error: 'La misma llave de idempotencia no puede usarse con otro payload' },
            };
        }

        if (fila.estado === 'COMPLETADA' && fila.respuesta_http !== null && fila.respuesta_body !== null) {
            return {
                tipo: 'REPLAY',
                statusCode: fila.respuesta_http,
                body: fila.respuesta_body,
            };
        }

        return {
            tipo: 'CONFLICTO',
            statusCode: 409,
            body: { error: 'Solicitud en progreso para esta llave de idempotencia' },
        };
    }

    async completar(
        client: PoolClient,
        numeroTarjeta: string,
        endpoint: TipoOperacionIdempotente,
        idempotencyKey: string,
        statusCode: number,
        body: unknown,
    ): Promise<void> {
        await client.query(
            `
            UPDATE BancoFuego.IdempotenciaOperacion
            SET estado = 'COMPLETADA',
                respuesta_http = $4,
                respuesta_body = $5::jsonb,
                updated_at = NOW()
            WHERE numero_tarjeta = $1
                AND endpoint = $2
                AND idempotency_key = $3
            `,
            [numeroTarjeta, endpoint, idempotencyKey, statusCode, JSON.stringify(body)],
        );
    }
}
