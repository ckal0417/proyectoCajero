import logger from '../../../shared/Logger';
import { ICuentaRepository } from '../../Ports/ICuentaRepository';
import { Resultado, ResultadoOperacion } from '../../models/Resultado';
import { CuentaOperacionQueryService } from './CuentaOperacionQueryService';
import { ServiceResponse } from './types';

export class ObtenerSaldoService {
    constructor(
        private readonly cuentaRepository: ICuentaRepository,
        private readonly cuentaQueryService: CuentaOperacionQueryService,
    ) { }

    async ejecutar(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        try {
            if (!numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idCuenta = await this.cuentaQueryService.obtenerIdCuentaPorTarjeta(numeroTarjeta);

            if (idCuenta === null) {
                return this.fallido('Cuenta no encontrada', 404);
            }

            const cuenta = await this.cuentaRepository.buscarPorId(idCuenta);

            if (!cuenta) {
                return this.fallido('Cuenta no encontrada', 404);
            }

            logger.info(`Consulta de saldo para tarjeta: ${numeroTarjeta}`);
            return ResultadoOperacion.exitoso({ status: 200, body: { saldo: cuenta.obtenerSaldo().toNumber() } });
        } catch (error) {
            logger.error('Error consultando saldo:', error);
            return this.fallido('Error interno del servidor', 500);
        }
    }

    private fallido(mensaje: string, statusCode: number): Resultado<ServiceResponse> {
        return ResultadoOperacion.fallido({ mensaje, statusCode });
    }
}
