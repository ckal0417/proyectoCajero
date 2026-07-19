export const MovimientoQueries = {
    CREAR: `
        INSERT INTO BancoFuego.Movimiento
            (naturaleza, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
        VALUES ($1, $2, $3, $4, $5, $6)
    `,
} as const;
