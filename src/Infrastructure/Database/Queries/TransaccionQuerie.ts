export const TransaccionQueries = {
    CREAR: `
        INSERT INTO BancoFuego.Transaccion
            (tipo, monto, estado, descripcion, id_cajero, referencia_externa, idempotency_key, estado_detalle, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id_transaccion, tipo, monto, fecha, estado, descripcion, id_cajero, referencia_externa, idempotency_key, estado_detalle, updated_at
    `,
} as const;
