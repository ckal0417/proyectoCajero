import logger from '../../../shared/Logger';
import { Resultado, ResultadoOperacion } from '../../models/Resultado';
import { CuentaOperacionQueryService } from './CuentaOperacionQueryService';
import { TitularCuentaResponse } from './types';

export class ConsultaTitularCuentaService {
    constructor(private readonly cuentaQueryService: CuentaOperacionQueryService) { }

    async ejecutar(numeroCuenta: string): Promise<Resultado<TitularCuentaResponse>> {
        try {
            const numeroCuentaNormalizado = numeroCuenta.trim();
            if (numeroCuentaNormalizado.length === 0) {
                return ResultadoOperacion.fallido({ mensaje: 'Número de cuenta destino inválido', statusCode: 400 });
            }

            const titular = await this.cuentaQueryService.obtenerTitularCuenta(numeroCuentaNormalizado);
            if (!titular) {
                return ResultadoOperacion.fallido({ mensaje: 'Cuenta destino no encontrada', statusCode: 404 });
            }

            return ResultadoOperacion.exitoso({
                numeroCuenta: titular.numero_cuenta,
                nombreCliente: titular.nombre_cliente,
            });
        } catch (error) {
            logger.error('Error obteniendo titular de cuenta:', error);
            return ResultadoOperacion.fallido({ mensaje: 'Error interno del servidor', statusCode: 500 });
        }
    }
}
