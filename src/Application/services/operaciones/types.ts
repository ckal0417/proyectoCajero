export type TipoOperacionIdempotente = 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA';

export type EstadoIdempotencia =
    | { tipo: 'NUEVA' }
    | { tipo: 'REPLAY'; statusCode: number; body: unknown }
    | { tipo: 'CONFLICTO'; statusCode: number; body: { error: string } };

export interface ServiceResponse {
    status: number;
    body: unknown;
}

export interface TitularCuentaResponse {
    numeroCuenta: string;
    nombreCliente: string;
}
