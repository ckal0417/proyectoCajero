import { Response } from 'express';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { Dinero } from '../../../Domain/Value-Objects/Dinero';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PostgresConnection } from '../../../Infrastructure/Database/PostgresConnection';
import logger from '../../../shared/Logger';

const cuentaRepository = new CuentaRepositoryPostgres();
const pool = PostgresConnection.obtenerPool();

interface FilaCuentaTarjeta {
    id_cuenta: number;
}

interface FilaCuentaDestino {
    id_cuenta: number;
}

interface FilaTransaccion {
    id_transaccion: number;
}

interface FilaHistorial {
    tipo: string;
    monto: string;
    fecha: Date;
}

async function obtenerIdCuentaPorTarjeta(numeroTarjeta: string): Promise<number | null> {
    const resultado = await pool.query<FilaCuentaTarjeta>(
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

async function obtenerIdCuentaPorNumero(numeroCuenta: string): Promise<number | null> {
    const resultado = await pool.query<FilaCuentaDestino>(
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

async function registrarTransaccionYMovimiento(args: {
    tipo: 'DEPOSITO' | 'RETIRO';
    monto: number;
    idCuenta: number;
    saldoAnterior: number;
    saldoNuevo: number;
    descripcion?: string;
}): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const transaccion = await client.query<FilaTransaccion>(
            `
            INSERT INTO BancoFuego.Transaccion (tipo, monto, estado, descripcion)
            VALUES ($1, $2, 'EXITOSA', $3)
            RETURNING id_transaccion
            `,
            [args.tipo, args.monto, args.descripcion ?? null],
        );

        const idTransaccion = transaccion.rows[0]!.id_transaccion;

        await client.query(
            `
            INSERT INTO BancoFuego.Movimiento
                (tipo, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [args.tipo, args.monto, args.saldoAnterior, args.saldoNuevo, args.idCuenta, idTransaccion],
        );

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function registrarTransferencia(args: {
    monto: number;
    idCuentaOrigen: number;
    idCuentaDestino: number;
    saldoAnteriorOrigen: number;
    saldoNuevoOrigen: number;
    saldoAnteriorDestino: number;
    saldoNuevoDestino: number;
}): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const transaccion = await client.query<FilaTransaccion>(
            `
            INSERT INTO BancoFuego.Transaccion (tipo, monto, estado, descripcion)
            VALUES ('TRANSFERENCIA', $1, 'EXITOSA', 'Transferencia interna')
            RETURNING id_transaccion
            `,
            [args.monto],
        );

        const idTransaccion = transaccion.rows[0]!.id_transaccion;

        await client.query(
            `
            INSERT INTO BancoFuego.Movimiento
                (tipo, monto, saldo_anterior, saldo_nuevo, id_cuenta, id_transaccion)
            VALUES
                ('TRANSFERENCIA', $1, $2, $3, $4, $6),
                ('TRANSFERENCIA', $1, $5, $7, $8, $6)
            `,
            [
                args.monto,
                args.saldoAnteriorOrigen,
                args.saldoNuevoOrigen,
                args.idCuentaOrigen,
                args.saldoAnteriorDestino,
                idTransaccion,
                args.saldoNuevoDestino,
                args.idCuentaDestino,
            ],
        );

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * GET /operaciones/saldo
 * Obtiene el saldo de la cuenta del usuario autenticado
 */
export async function obtenerSaldoController(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.numeroTarjeta) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        const idCuenta = await obtenerIdCuentaPorTarjeta(req.numeroTarjeta);

        if (idCuenta === null) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const cuenta = await cuentaRepository.buscarPorId(idCuenta);

        if (!cuenta) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        logger.info(`Consulta de saldo para tarjeta: ${req.numeroTarjeta}`);
        res.json({ saldo: cuenta.obtenerSaldo().toNumber() });
    } catch (error) {
        logger.error('Error consultando saldo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * POST /operaciones/depositar
 * Realiza un depósito a la cuenta del usuario autenticado
 */
export async function depositarController(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.numeroTarjeta) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        const { monto } = req.body;

        if (!monto || monto <= 0) {
            res.status(400).json({ error: 'Monto debe ser mayor a 0' });
            return;
        }

        const idCuenta = await obtenerIdCuentaPorTarjeta(req.numeroTarjeta);

        if (idCuenta === null) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const cuenta = await cuentaRepository.buscarPorId(idCuenta);

        if (!cuenta) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const { saldoAnterior, saldoNuevo } = cuenta.depositar(Dinero.desde(Number(monto)));
        await cuentaRepository.actualizar(cuenta);
        await registrarTransaccionYMovimiento({
            tipo: 'DEPOSITO',
            monto: Number(monto),
            idCuenta,
            saldoAnterior: saldoAnterior.toNumber(),
            saldoNuevo: saldoNuevo.toNumber(),
            descripcion: 'Depósito por API',
        });

        logger.info(`Depósito exitoso: $${monto} para tarjeta ${req.numeroTarjeta}`);
        res.json({
            mensaje: 'Depósito exitoso',
            nuevoSaldo: saldoNuevo.toNumber(),
        });
    } catch (error) {
        logger.error('Error en depósito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/**
 * POST /operaciones/retirar
 * Realiza un retiro de la cuenta del usuario autenticado
 */
export async function retirarController(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.numeroTarjeta) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        const { monto } = req.body;

        if (!monto || monto <= 0) {
            res.status(400).json({ error: 'Monto debe ser mayor a 0' });
            return;
        }

        const idCuenta = await obtenerIdCuentaPorTarjeta(req.numeroTarjeta);

        if (idCuenta === null) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const cuenta = await cuentaRepository.buscarPorId(idCuenta);

        if (!cuenta) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const { saldoAnterior, saldoNuevo } = cuenta.retirar(Dinero.desde(Number(monto)));
        await cuentaRepository.actualizar(cuenta);
        await registrarTransaccionYMovimiento({
            tipo: 'RETIRO',
            monto: Number(monto),
            idCuenta,
            saldoAnterior: saldoAnterior.toNumber(),
            saldoNuevo: saldoNuevo.toNumber(),
            descripcion: 'Retiro por API',
        });

        logger.info(`Retiro exitoso: $${monto} para tarjeta ${req.numeroTarjeta}`);
        res.json({
            mensaje: 'Retiro exitoso',
            nuevoSaldo: saldoNuevo.toNumber(),
        });
    } catch (error) {
        logger.warn(`Retiro fallido para tarjeta ${req.numeroTarjeta}: ${String(error)}`);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Retiro no disponible' });
    }
}

/**
 * POST /operaciones/transferir
 * Realiza una transferencia desde la cuenta del usuario autenticado
 */
export async function transferirController(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.numeroTarjeta) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        const { numeroCuentaDestino, monto } = req.body;

        if (!numeroCuentaDestino || !monto || monto <= 0) {
            res.status(400).json({
                error: 'numeroCuentaDestino y monto (mayor a 0) son requeridos',
            });
            return;
        }

        const idCuentaOrigen = await obtenerIdCuentaPorTarjeta(req.numeroTarjeta);

        if (idCuentaOrigen === null) {
            res.status(404).json({ error: 'Cuenta origen no encontrada' });
            return;
        }

        const idCuentaDestino = await obtenerIdCuentaPorNumero(String(numeroCuentaDestino));

        if (idCuentaDestino === null) {
            res.status(404).json({ error: 'Cuenta destino no encontrada' });
            return;
        }

        if (idCuentaOrigen === idCuentaDestino) {
            res.status(400).json({ error: 'La cuenta destino debe ser distinta a la de origen' });
            return;
        }

        const cuentaOrigen = await cuentaRepository.buscarPorId(idCuentaOrigen);
        const cuentaDestino = await cuentaRepository.buscarPorId(idCuentaDestino);

        if (!cuentaOrigen || !cuentaDestino) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const montoDinero = Dinero.desde(Number(monto));
        const { saldoAnterior: saldoAnteriorOrigen, saldoNuevo: saldoNuevoOrigen } =
            cuentaOrigen.retirar(montoDinero);
        const { saldoAnterior: saldoAnteriorDestino, saldoNuevo: saldoNuevoDestino } =
            cuentaDestino.depositar(montoDinero);

        await cuentaRepository.actualizar(cuentaOrigen);
        await cuentaRepository.actualizar(cuentaDestino);

        await registrarTransferencia({
            monto: Number(monto),
            idCuentaOrigen,
            idCuentaDestino,
            saldoAnteriorOrigen: saldoAnteriorOrigen.toNumber(),
            saldoNuevoOrigen: saldoNuevoOrigen.toNumber(),
            saldoAnteriorDestino: saldoAnteriorDestino.toNumber(),
            saldoNuevoDestino: saldoNuevoDestino.toNumber(),
        });

        logger.info(
            `Transferencia exitosa: $${monto} desde ${req.numeroTarjeta} a ${numeroCuentaDestino}`
        );
        res.json({
            mensaje: 'Transferencia exitosa',
            nuevoSaldo: saldoNuevoOrigen.toNumber(),
        });
    } catch (error) {
        logger.warn(`Transferencia fallida: ${String(error)}`);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Transferencia no disponible' });
    }
}

/**
 * GET /operaciones/historial
 * Obtiene el historial de transacciones del usuario autenticado
 */
export async function obtenerHistorialController(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.numeroTarjeta) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        const idCuenta = await obtenerIdCuentaPorTarjeta(req.numeroTarjeta);

        if (idCuenta === null) {
            res.status(404).json({ error: 'Cuenta no encontrada' });
            return;
        }

        const resultado = await pool.query<FilaHistorial>(
            `
            SELECT m.tipo, m.monto, m.fecha
            FROM BancoFuego.Movimiento m
            WHERE m.id_cuenta = $1
            ORDER BY m.fecha DESC
            `,
            [idCuenta],
        );

        const historial = resultado.rows.map((fila) => ({
            tipo: fila.tipo,
            monto: Number(fila.monto),
            fecha: fila.fecha,
        }));

        if (!historial || historial.length === 0) {
            logger.info(`Historial vacío para tarjeta: ${req.numeroTarjeta}`);
            res.json({ historial: [], mensaje: 'No hay transacciones' });
            return;
        }

        logger.info(`Consulta de historial para tarjeta: ${req.numeroTarjeta}`);
        res.json({ historial });
    } catch (error) {
        logger.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
