export const TransaccionQueries = {
    CREAR: `
        INSERT INTO BancoFuego.Transaccion
            (tipo, monto, estado, descripcion, id_cajero)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_transaccion, tipo, monto, fecha, estado, descripcion, id_cajero
    `,
} as const;
