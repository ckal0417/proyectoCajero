import logger from '../../../shared/Logger';
import { Resultado, ResultadoOperacion } from '../../models/Resultado';
import { CuentaOperacionQueryService } from './CuentaOperacionQueryService';
import { ServiceResponse } from './types';

export class ObtenerHistorialService {
    constructor(private readonly cuentaQueryService: CuentaOperacionQueryService) { }

    async ejecutar(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        try {
            if (!numeroTarjeta) {
                return this.fallido('No autorizado', 401);
            }

            const idCuenta = await this.cuentaQueryService.obtenerIdCuentaPorTarjeta(numeroTarjeta);

            if (idCuenta === null) {
                return this.fallido('Cuenta no encontrada', 404);
            }

            const filas = await this.cuentaQueryService.obtenerHistorialPorCuenta(idCuenta);
            const historial = filas.map((fila) => ({
                tipo: fila.tipo,
                monto: Number(fila.monto),
                fecha: fila.fecha,
            }));

            if (historial.length === 0) {
                logger.info(`Historial vacio para tarjeta: ${numeroTarjeta}`);
                return ResultadoOperacion.exitoso({ status: 200, body: { historial: [], mensaje: 'No hay transacciones' } });
            }

            logger.info(`Consulta de historial para tarjeta: ${numeroTarjeta}`);
            return ResultadoOperacion.exitoso({ status: 200, body: { historial } });
        } catch (error) {
            logger.error('Error obteniendo historial:', error);
            return this.fallido('Error interno del servidor', 500);
        }
    }

    private fallido(mensaje: string, statusCode: number): Resultado<ServiceResponse> {
        return ResultadoOperacion.fallido({ mensaje, statusCode });
    }
}
