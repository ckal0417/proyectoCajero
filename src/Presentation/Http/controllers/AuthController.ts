import { Response } from 'express';
import { AuthRequest, generarToken } from '../middleware/AuthMiddleware';
import { TarjetaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PinHasherBcrypt } from '../../../Infrastructure/Persistence/PinHasherBcrypt';
import logger from '../../../shared/Logger';
import { autenticacionService } from '../../../Application/services/AutenticationService';

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
            res.status(400).json({ error: 'numeroTarjeta y pin son requeridos' });
            return;
        }

        const resultado = await autenticacionService.autenticar(String(numeroTarjeta), String(pin));

        if (!resultado.exito) {
            const status = resultado.error === 'Error interno del servidor' ? 500 : 401;
            res.status(status).json({ error: resultado.error });
            return;
        }

        const token = generarToken(resultado.numeroTarjeta, resultado.numeroTarjeta);
        res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
        res.json({ mensaje: 'Login exitoso', token, usuario: { nombre: 'Cliente', numeroTarjeta: resultado.numeroTarjeta, saldo: resultado.saldo } });
    } catch (error) {
        if (error instanceof Error && (error.message.includes('número de tarjeta') || error.message.includes('PIN'))) {
            res.status(400).json({ error: error.message });
            return;
        }
        logger.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

