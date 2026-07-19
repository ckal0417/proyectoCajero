// Application/services/AutenticacionService.ts
import { TarjetaRepositoryPostgres } from '../../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from '../../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from '../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PinHasherBcrypt } from '../../Infrastructure/Persistence/PinHasherBcrypt';
import { NumeroTarjeta } from '../../Domain/Value-Objects/NumeroTarjeta';
import { PinTextoPlano } from '../../Domain/Value-Objects/Pin';
import logger from '../../shared/Logger';
import { NumeroCuenta } from '../../Domain/Value-Objects/NumeroCuenta';
import { Resultado, ResultadoOperacion } from '../models/Resultado';


export interface DatosAutenticacion {
    nombre: string;
    numeroTarjeta: string;
    numeroCuenta: string | NumeroCuenta;
    saldo: number;
}

export class AutenticacionService {
    private readonly tarjetaRepository = new TarjetaRepositoryPostgres();
    private readonly autenticacionRepository = new AutenticacionRepositoryPostgres();
    private readonly cuentaRepository = new CuentaRepositoryPostgres();
    private readonly pinHasher = new PinHasherBcrypt();

    async autenticar(numeroTarjeta: string, pin: string): Promise<Resultado<DatosAutenticacion>> {
        try {
            const numeroTarjetaVO = NumeroTarjeta.desde(numeroTarjeta);
            const pinPlano = PinTextoPlano.desde(pin);

            const tarjeta = await this.tarjetaRepository.buscarPorNumero(numeroTarjetaVO);
            if (!tarjeta) {
                logger.warn(`Intento de login fallido para tarjeta: ${numeroTarjeta}`);
                return ResultadoOperacion.fallido({ mensaje: 'Credenciales inválidas', statusCode: 401 });
            }

            const idTarjeta = tarjeta.obtenerId();
            if (!idTarjeta) {
                logger.error(`Tarjeta sin id para login: ${numeroTarjeta}`);
                return ResultadoOperacion.fallido({ mensaje: 'Error interno del servidor', statusCode: 500 });
            }

            const autenticacion = await this.autenticacionRepository.buscarPorIdTarjeta(idTarjeta);
            if (!autenticacion) {
                logger.warn(`Autenticación no encontrada para tarjeta: ${numeroTarjeta}`);
                return ResultadoOperacion.fallido({ mensaje: 'Credenciales inválidas', statusCode: 401 });
            }

            const pinValido = await autenticacion.verificarPin(pinPlano, this.pinHasher);
            await this.autenticacionRepository.guardar(autenticacion);

            if (!pinValido) {
                logger.warn(`Intento de login fallido para tarjeta: ${numeroTarjeta}`);
                return ResultadoOperacion.fallido({ mensaje: 'Credenciales inválidas', statusCode: 401 });
            }

            const cuenta = await this.cuentaRepository.buscarPorId(tarjeta.obtenerIdCuenta());
            logger.info(`Login exitoso para tarjeta: ${numeroTarjeta}`);

            return ResultadoOperacion.exitoso({
                numeroTarjeta,
                nombre: tarjeta.obtenerNombre(),
                numeroCuenta: cuenta?.obtenerNumeroCuenta() ?? '',
                saldo: cuenta?.obtenerSaldo().toNumber() ?? 0,
            });
        } catch (error) {
            if (error instanceof Error && (error.message.includes('número de tarjeta') || error.message.includes('PIN'))) {
                return ResultadoOperacion.fallido({ mensaje: error.message, statusCode: 400 });
            }

            logger.error('Error en autenticacion:', error);
            return ResultadoOperacion.fallido({ mensaje: 'Error interno del servidor', statusCode: 500 });
        }
    }
}

export const autenticacionService = new AutenticacionService();