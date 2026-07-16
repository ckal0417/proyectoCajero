// Application/services/AutenticacionService.ts
import { TarjetaRepositoryPostgres } from '../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from '../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from '../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PinHasherBcrypt } from '../../Infrastructure/Persistence/PinHasherBcrypt';
import { NumeroTarjeta } from '../../Domain/Value-Objects/NumeroTarjeta';
import { PinTextoPlano } from '../../Domain/Value-Objects/Pin';
import logger from '../../shared/Logger';
import { NumeroCuenta } from '../../Domain/Value-Objects/NumeroCuenta';

export type ResultadoAutenticacion =
    | { exito: true; numeroTarjeta: string; numeroCuenta: string | NumeroCuenta; saldo: number }
    | { exito: false; error: string };

export class AutenticacionService {
    private readonly tarjetaRepository = new TarjetaRepositoryPostgres();
    private readonly autenticacionRepository = new AutenticacionRepositoryPostgres();
    private readonly cuentaRepository = new CuentaRepositoryPostgres();
    private readonly pinHasher = new PinHasherBcrypt();

    async autenticar(numeroTarjeta: string, pin: string): Promise<ResultadoAutenticacion> {
        const numeroTarjetaVO = NumeroTarjeta.desde(numeroTarjeta);
        const pinPlano = PinTextoPlano.desde(pin);

        const tarjeta = await this.tarjetaRepository.buscarPorNumero(numeroTarjetaVO);
        if (!tarjeta) {
            logger.warn(`Intento de login fallido para tarjeta: ${numeroTarjeta}`);
            return { exito: false, error: 'Credenciales inválidas' };
        }

        const idTarjeta = tarjeta.obtenerId();
        if (!idTarjeta) {
            logger.error(`Tarjeta sin id para login: ${numeroTarjeta}`);
            return { exito: false, error: 'Error interno del servidor' };
        }

        const autenticacion = await this.autenticacionRepository.buscarPorIdTarjeta(idTarjeta);
        if (!autenticacion) {
            logger.warn(`Autenticación no encontrada para tarjeta: ${numeroTarjeta}`);
            return { exito: false, error: 'Credenciales inválidas' };
        }

        const pinValido = await autenticacion.verificarPin(pinPlano, this.pinHasher);
        await this.autenticacionRepository.guardar(autenticacion);

        if (!pinValido) {
            logger.warn(`Intento de login fallido para tarjeta: ${numeroTarjeta}`);
            return { exito: false, error: 'Credenciales inválidas' };
        }

        const cuenta = await this.cuentaRepository.buscarPorId(tarjeta.obtenerIdCuenta());
        logger.info(`Login exitoso para tarjeta: ${numeroTarjeta}`);

        return { exito: true, numeroTarjeta, numeroCuenta: cuenta?.obtenerNumeroCuenta() ?? '', saldo: cuenta?.obtenerSaldo().toNumber() ?? 0 };
    }
}

export const autenticacionService = new AutenticacionService();