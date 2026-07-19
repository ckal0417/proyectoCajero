import { CuentaRepositoryPostgres } from '../../Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { PostgresConnection } from '../../Infrastructure/Database/PostgresConnection';
import { Resultado } from '../models/Resultado';
import { ConsultaTitularCuentaService } from './operaciones/ConsultaTitularCuentaService';
import { CuentaOperacionQueryService } from './operaciones/CuentaOperacionQueryService';
import { DepositoOperacionService } from './operaciones/DepositoOperacionService';
import { IdempotenciaService } from './operaciones/IdempotenciaService';
import { ObtenerHistorialService } from './operaciones/ObtenerHistorialService';
import { ObtenerSaldoService } from './operaciones/ObtenerSaldoService';
import { RetiroOperacionService } from './operaciones/RetiroOperacionService';
import { ServiceResponse, TitularCuentaResponse } from './operaciones/types';
import { TransferenciaOperacionService } from './operaciones/TransferenciaInternaService';

export { ServiceResponse } from './operaciones/types';

export class OperacionesBancariasService {
    private readonly cuentaRepository = new CuentaRepositoryPostgres();

    private readonly pool = PostgresConnection.obtenerPool();

    private readonly cuentaQueryService = new CuentaOperacionQueryService(this.pool);

    private readonly idempotenciaService = new IdempotenciaService();

    private readonly obtenerSaldoService = new ObtenerSaldoService(this.cuentaRepository, this.cuentaQueryService);

    private readonly obtenerHistorialService = new ObtenerHistorialService(this.cuentaQueryService);

    private readonly consultaTitularCuentaService = new ConsultaTitularCuentaService(this.cuentaQueryService);

    private readonly depositoOperacionService = new DepositoOperacionService(
        this.pool,
        this.cuentaQueryService,
        this.idempotenciaService,
    );

    private readonly retiroOperacionService = new RetiroOperacionService(
        this.pool,
        this.cuentaQueryService,
        this.idempotenciaService,
    );

    private readonly transferenciaOperacionService = new TransferenciaOperacionService(
        this.pool,
        this.cuentaQueryService,
        this.idempotenciaService,
    );

    async obtenerSaldo(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        return this.obtenerSaldoService.ejecutar(numeroTarjeta);
    }

    async obtenerHistorial(numeroTarjeta: string | undefined): Promise<Resultado<ServiceResponse>> {
        return this.obtenerHistorialService.ejecutar(numeroTarjeta);
    }

    async obtenerTitularCuenta(numeroCuenta: string): Promise<Resultado<TitularCuentaResponse>> {
        return this.consultaTitularCuentaService.ejecutar(numeroCuenta);
    }

    async depositar(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        return this.depositoOperacionService.ejecutar(args);
    }

    async retirar(args: {
        numeroTarjeta: string | undefined;
        idempotencyKey?: string | null;
        monto: unknown;
    }): Promise<Resultado<ServiceResponse>> {
        return this.retiroOperacionService.ejecutar(args);
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
        return this.transferenciaOperacionService.ejecutar(args);
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

export const operacionesBancariasService = new OperacionesBancariasService();
