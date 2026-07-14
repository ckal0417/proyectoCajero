import { Response } from 'express';
import { AuthRequest, generarToken } from '../middleware/AuthMiddleware';
import { TarjetaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PinHasherBcrypt } from '../../../Infrastructure/Persistence/PinHasherBcrypt';
import { NumeroTarjeta } from '../../../Domain/Value-Objects/NumeroTarjeta';
import { PinTextoPlano } from '../../../Domain/Value-Objects/Pin';
import logger from '../../../shared/Logger';

const tarjetaRepository = new TarjetaRepositoryPostgres();
const autenticacionRepository = new AutenticacionRepositoryPostgres();
const cuentaRepository = new CuentaRepositoryPostgres();
const pinHasher = new PinHasherBcrypt();

/**
 * POST /auth/login
 * Autentica un usuario con tarjeta y PIN
 */
export async function loginController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { numeroTarjeta, pin } = req.body;

        if (!numeroTarjeta || !pin) {
            res.status(400).json({
                error: 'numeroTarjeta y pin son requeridos',
            });
            return;
        }

        const numeroTarjetaVO = NumeroTarjeta.desde(String(numeroTarjeta));
        const pinPlano = PinTextoPlano.desde(String(pin));
        const tarjeta = await tarjetaRepository.buscarPorNumero(numeroTarjetaVO);

        if (!tarjeta) {
            logger.warn(`Intento de login fallido para tarjeta: ${numeroTarjeta}`);
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        const idTarjeta = tarjeta.obtenerId();

        if (!idTarjeta) {
            logger.error(`Tarjeta sin id para login: ${numeroTarjeta}`);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }

        const autenticacion = await autenticacionRepository.buscarPorIdTarjeta(idTarjeta);

        if (!autenticacion) {
            logger.warn(`Autenticación no encontrada para tarjeta: ${numeroTarjeta}`);
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        const pinValido = await autenticacion.verificarPin(pinPlano, pinHasher);
        await autenticacionRepository.guardar(autenticacion);

        if (!pinValido) {
            logger.warn(`Intento de login fallido para tarjeta: ${numeroTarjeta}`);
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        const cuenta = await cuentaRepository.buscarPorId(tarjeta.obtenerIdCuenta());

        const token = generarToken(numeroTarjeta, numeroTarjeta);
        logger.info(`Login exitoso para tarjeta: ${numeroTarjeta}`);

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                nombre: 'Cliente',
                numeroTarjeta,
                saldo: cuenta?.obtenerSaldo().toNumber() ?? 0,
            },
        });
    } catch (error) {
        logger.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
