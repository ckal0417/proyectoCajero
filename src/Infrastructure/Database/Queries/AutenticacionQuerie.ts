export const AutenticacionQueries = {
    BUSCAR_POR_ID_TARJETA: `
        SELECT id_autenticacion, pin, intentos, bloqueado, id_tarjeta
        FROM BancoFuego.Autenticacion
        WHERE id_tarjeta = $1
    `,
    GUARDAR: `
        UPDATE BancoFuego.Autenticacion
        SET pin = $1, intentos = $2, bloqueado = $3
        WHERE id_tarjeta = $4
    `,
} as const;
