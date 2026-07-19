export const TIPOS_CUENTA = ['AHORRO', 'CORRIENTE'] as const;
export type TipoCuenta = (typeof TIPOS_CUENTA)[number];
    
export const TIPOS_TARJETA = ['DEBITO', 'CREDITO'] as const;
export type TipoTarjeta = (typeof TIPOS_TARJETA)[number];
    
export const TIPOS_TRANSACCION = [
    'DEPOSITO',
    'RETIRO',
    'TRANSFERENCIA_INTERNA',
    'TRANSFERENCIA_EXTERNA',
] as const;
export type TipoTransaccion = (typeof TIPOS_TRANSACCION)[number];
    
export const ESTADOS_TRANSACCION = ['PENDIENTE', 'EXITOSA', 'FALLIDA', 'CANCELADA'] as const;
export type EstadoTransaccion = (typeof ESTADOS_TRANSACCION)[number];

export const NATURALEZAS_MOVIMIENTO = ['CREDITO', 'DEBITO'] as const;
export type TipoMovimiento = (typeof NATURALEZAS_MOVIMIENTO)[number];

export function esValorValido<T extends string>(
    valoresPermitidos: readonly T[],
    valor: string,
    ): valor is T {
    return (valoresPermitidos as readonly string[]).includes(valor);
}