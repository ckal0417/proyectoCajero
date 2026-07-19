import { Pool, PoolClient } from 'pg';

interface FilaCuentaTarjeta {
    id_cuenta: number;
}

interface FilaCuentaDestino {
    id_cuenta: number;
}

interface FilaCuentaNumero {
    numero_cuenta: string;
}

interface FilaCuentaBloqueada {
    id_cuenta: number;
    saldo: string;
    activa: boolean;
}

interface FilaTitularCuenta {
    numero_cuenta: string;
    nombre_cliente: string;
}

interface FilaHistorial {
    tipo: string;
    monto: string;
    fecha: Date;
}

export class CuentaOperacionQueryService {
    constructor(private readonly pool: Pool) {}

    async obtenerIdCuentaPorTarjeta(numeroTarjeta: string): Promise<number | null> {
        const resultado = await this.pool.query<FilaCuentaTarjeta>(
            `
            SELECT t.id_cuenta
            FROM BancoFuego.Tarjeta t
            WHERE t.numero_tarjeta = $1
            LIMIT 1
            `,
            [numeroTarjeta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.id_cuenta;
    }

    async obtenerIdCuentaPorTarjetaTx(client: PoolClient, numeroTarjeta: string): Promise<number | null> {
        const resultado = await client.query<FilaCuentaTarjeta>(
            `
            SELECT t.id_cuenta
            FROM BancoFuego.Tarjeta t
            WHERE t.numero_tarjeta = $1
            LIMIT 1
            `,
            [numeroTarjeta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.id_cuenta;
    }

    async obtenerIdCuentaPorNumeroTx(client: PoolClient, numeroCuenta: string): Promise<number | null> {
        const resultado = await client.query<FilaCuentaDestino>(
            `
            SELECT c.id_cuenta
            FROM BancoFuego.Cuenta c
            WHERE c.numero_cuenta = $1
            LIMIT 1
            `,
            [numeroCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.id_cuenta;
    }

    async obtenerNumeroCuentaPorIdTx(client: PoolClient, idCuenta: number): Promise<string | null> {
        const resultado = await client.query<FilaCuentaNumero>(
            `
            SELECT c.numero_cuenta
            FROM BancoFuego.Cuenta c
            WHERE c.id_cuenta = $1
            LIMIT 1
            `,
            [idCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!.numero_cuenta;
    }

    async obtenerCuentaBloqueada(client: PoolClient, idCuenta: number): Promise<FilaCuentaBloqueada | null> {
        const resultado = await client.query<FilaCuentaBloqueada>(
            `
            SELECT c.id_cuenta, c.saldo, c.activa
            FROM BancoFuego.Cuenta c
            WHERE c.id_cuenta = $1
            FOR UPDATE
            `,
            [idCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!;
    }

    async obtenerCuentasBloqueadasPorIds(client: PoolClient, ids: number[]): Promise<FilaCuentaBloqueada[]> {
        const idsOrdenados = [...ids].sort((a, b) => a - b);
        const resultado = await client.query<FilaCuentaBloqueada>(
            `
            SELECT c.id_cuenta, c.saldo, c.activa
            FROM BancoFuego.Cuenta c
            WHERE c.id_cuenta = ANY($1::int[])
            ORDER BY c.id_cuenta
            FOR UPDATE
            `,
            [idsOrdenados],
        );

        return resultado.rows;
    }

    async obtenerTitularCuenta(numeroCuenta: string): Promise<FilaTitularCuenta | null> {
        const resultado = await this.pool.query<FilaTitularCuenta>(
            `
            SELECT c.numero_cuenta, CONCAT(cl.nombres, ' ', cl.apellidos) AS nombre_cliente
            FROM BancoFuego.Cuenta c
            INNER JOIN BancoFuego.Cliente cl ON cl.id_cliente = c.id_cliente
            WHERE c.numero_cuenta = $1
            LIMIT 1
            `,
            [numeroCuenta],
        );

        if (resultado.rowCount === 0) {
            return null;
        }

        return resultado.rows[0]!;
    }

    async obtenerHistorialPorCuenta(idCuenta: number): Promise<FilaHistorial[]> {
        const resultado = await this.pool.query<FilaHistorial>(
            `
            SELECT m.naturaleza AS tipo, m.monto, m.fecha
            FROM BancoFuego.Movimiento m
            WHERE m.id_cuenta = $1
            ORDER BY m.fecha DESC
            `,
            [idCuenta],
        );

        return resultado.rows;
    }
}
