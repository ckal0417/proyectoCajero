import { Resultado } from '../models/Resultado';
import { ConsultaTitularCuentaService } from './operaciones/ConsultaTitularCuentaService';
import { DepositoOperacionService } from './operaciones/DepositoOperacionService';
import { ObtenerHistorialService } from './operaciones/ObtenerHistorialService';
import { ObtenerSaldoService } from './operaciones/ObtenerSaldoService';
import { RetiroOperacionService } from './operaciones/RetiroOperacionService';
import { ServiceResponse, TitularCuentaResponse } from './operaciones/types';
import { TransferenciaOperacionService } from './operaciones/TransferenciaInternaService';

export { ServiceResponse } from './operaciones/types';

interface OperacionesBancariasDependencies {
    obtenerSaldoService: ObtenerSaldoService;
    obtenerHistorialService: ObtenerHistorialService;
    consultaTitularCuentaService: ConsultaTitularCuentaService;
    depositoOperacionService: DepositoOperacionService;
    retiroOperacionService: RetiroOperacionService;
    transferenciaOperacionService: TransferenciaOperacionService;
}

export class OperacionesBancariasService {
    constructor(
        private readonly dependencies: OperacionesBancariasDependencies,
    ) { }

    async obtenerSaldo(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        return this.dependencies.obtenerSaldoService.ejecutar(numeroTarjeta);
    }

    async obtenerHistorial(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        return this.dependencies.obtenerHistorialService.ejecutar(numeroTarjeta);
    }

    async obtenerTitularCuenta(numeroCuenta: string): Promise<Resultado<TitularCuentaResponse>> {
        return this.dependencies.consultaTitularCuentaService.ejecutar(numeroCuenta);
    }

    async depositar(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        return this.dependencies.depositoOperacionService.ejecutar(args);
    }

    async retirar(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        return this.dependencies.retiroOperacionService.ejecutar(args);
    }

    async transferir(args: {
        numeroTarjeta: string | undefined;
        numeroCuentaOrigen?: string;
        idempotencyKey?: string | null;
        tipoTransferencia?: 'INTERNA' | 'EXTERNA';
        bancoDestino?: string;
        numeroCuentaDestino: unknown;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        return this.dependencies.transferenciaOperacionService.ejecutar(args);
    }

    obtenerIdempotencyKey(headerValue: string | string[] | undefined): string | null {
        if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
            return headerValue.trim();
        }

        if (Array.isArray(headerValue) && headerValue.length > 0) {
            const firstValue = headerValue[0]?.trim();
            if (firstValue && firstValue.length > 0) {
                return firstValue;
            }
        }

        return null;
    }
}
