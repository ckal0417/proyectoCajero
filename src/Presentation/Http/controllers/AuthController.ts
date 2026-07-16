import { Response } from 'express';
import { AuthRequest, generarToken } from '../middleware/AuthMiddleware';
import { TarjetaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from '../../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PinHasherBcrypt } from '../../../Infrastructure/Persistence/PinHasherBcrypt';
import logger from '../../../shared/Logger';
import { autenticacionService } from '../../../Application/services/AutenticationService';
import { ResultadoOperacion } from '../../../Application/models/Resultado';

const tarjetaRepository = new TarjetaRepositoryPostgres();
const autenticacionRepository = new AutenticacionRepositoryPostgres();
const cuentaRepository = new CuentaRepositoryPostgres();
const pinHasher = new PinHasherBcrypt();

/**
 * POST /auth/login
 * Autentica un usuario con tarjeta y PIN
 */
export async function loginController(req: AuthRequest, res: Response): Promise<void> {
    const { numeroTarjeta, pin } = req.body;
    if (!numeroTarjeta || !pin) {
        res.status(400).json({ error: 'numeroTarjeta y pin son requeridos' });
        return;
    }

    const resultado = await autenticacionService.autenticar(String(numeroTarjeta), String(pin));

    if (!resultado.estado) {
        const status = ResultadoOperacion.obtenerStatusError(resultado, 401);
        const mensaje = ResultadoOperacion.obtenerMensajeError(resultado);
        if (status >= 500) {
            logger.error('Error en login:', mensaje);
        }

        res.status(status).json({ error: mensaje });
        return;
    }

    const token = generarToken(resultado.valor.numeroTarjeta, resultado.valor.numeroTarjeta);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
    res.json({ mensaje: 'Login exitoso', token, usuario: { nombre: 'Cliente', numeroTarjeta: resultado.valor.numeroTarjeta, saldo: resultado.valor.saldo } });
}

