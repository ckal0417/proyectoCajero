export const TarjetaQueries = {
    BUSCAR_POR_NUMERO: `
        SELECT
            t.id_tarjeta,
            t.numero_tarjeta,
            t.tipo,
            t.fecha_vencimiento,
            t.cvv,
            t.activa,
            t.id_cuenta,
            CONCAT(c.nombres, ' ', c.apellidos) AS nombre_cliente
        FROM BancoFuego.Tarjeta t
        INNER JOIN BancoFuego.Cuenta cu ON cu.id_cuenta = t.id_cuenta
        INNER JOIN BancoFuego.Cliente c ON c.id_cliente = cu.id_cliente
        WHERE t.numero_tarjeta = $1
    `,
} as const;
