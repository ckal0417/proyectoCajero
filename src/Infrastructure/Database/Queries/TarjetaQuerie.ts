export const TarjetaQueries = {
    BUSCAR_POR_NUMERO: `
        SELECT id_tarjeta, numero_tarjeta, tipo, fecha_vencimiento, cvv, activa, id_cuenta
        FROM BancoFuego.Tarjeta
        WHERE numero_tarjeta = $1
    `,
} as const;
