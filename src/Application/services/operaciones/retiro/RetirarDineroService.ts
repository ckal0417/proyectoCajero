// Application/Services/RetirarDineroService.ts
import { Autenticacion } from "../../../../Domain/Entities/Autenticacion";
import { Movimiento } from "../../../../Domain/Entities/Movimiento";
import { Tarjeta } from "../../../../Domain/Entities/Tarjeta";
import { Cuenta } from "../../../../Domain/Entities/Cuenta";
import { Transaccion } from "../../../../Domain/Entities/Transaccion";
import { Dinero } from "../../../../Domain/Value-Objects/Dinero";
import { NumeroTarjeta } from "../../../../Domain/Value-Objects/NumeroTarjeta";
import { PinTextoPlano } from "../../../../Domain/Value-Objects/Pin";
import { IPinHasher } from "../../../../Domain/Value-Objects/PinHasher";
import { AutenticacionNoEncontradaError, 
    CuentaNoEncontradaError, PinIncorrectoError, 
    TarjetaNoEncontradaError, TarjetaNoUsableError } from "../../../../shared/Errors";
import { IAutenticacionRepository } from "../../../Ports/IAutenticacionRepository";
import { ICuentaRepository } from "../../../Ports/ICuentaRepository";
import { IMovimientoRepository } from "../../../Ports/IMovimientoRepository";
import { ITarjetaRepository } from "../../../Ports/ITarjetaRepository";
import { ITransaccionRepository } from "../../../Ports/ITransaccionRepository";

export interface RetirarDineroComando {
    numeroTarjeta: string;
    pin: string;
    monto: number;
    idCajero: number;
}

export interface RetirarDineroResultado {
    transaccion: Transaccion;
    movimiento: Movimiento;
    saldoNuevo: Dinero;
}

export class RetirarDineroService {
    constructor(
        private readonly tarjetaRepo: ITarjetaRepository,
        private readonly autenticacionRepo: IAutenticacionRepository,
        private readonly cuentaRepo: ICuentaRepository,
        private readonly transaccionRepo: ITransaccionRepository,
        private readonly movimientoRepo: IMovimientoRepository,
        private readonly pinHasher: IPinHasher,
    ) {}

    async ejecutar(comando: RetirarDineroComando): Promise<RetirarDineroResultado> {
        const numeroTarjeta = this.validarNumeroTarjeta(comando.numeroTarjeta);
        const tarjeta = await this.obtenerTarjetaValida(numeroTarjeta);

        const autenticacion = await this.obtenerAutenticacion(tarjeta);
        await this.autenticarPin(autenticacion, comando.pin);

        const cuenta = await this.obtenerCuenta(tarjeta);
        const monto = Dinero.desde(comando.monto);

        return this.ejecutarRetiroConPersistencia({
            cuenta,
            monto,
            idCajero: comando.idCajero,
        });
    }

    private validarNumeroTarjeta(numeroTarjeta: string): NumeroTarjeta {
        return NumeroTarjeta.desde(numeroTarjeta);
    }

    private async obtenerTarjetaValida(numeroTarjeta: NumeroTarjeta): Promise<Tarjeta> {
        const tarjeta = await this.tarjetaRepo.buscarPorNumero(numeroTarjeta);
        if (!tarjeta) {
            throw new TarjetaNoEncontradaError();
        }

        try {
            tarjeta.asegurarUsable();
        } catch (error) {
            throw new TarjetaNoUsableError(error instanceof Error ? error.message : 'La tarjeta no puede usarse');
        }

        return tarjeta;
    }

    private async obtenerAutenticacion(tarjeta: Tarjeta): Promise<Autenticacion> {
        const idTarjeta = tarjeta.obtenerId();
        if (!idTarjeta) {
            throw new AutenticacionNoEncontradaError();
        }

        const autenticacion = await this.autenticacionRepo.buscarPorIdTarjeta(idTarjeta);
        if (!autenticacion) {
            throw new AutenticacionNoEncontradaError();
        }

        return autenticacion;
    }

    private async autenticarPin(autenticacion: Autenticacion, pin: string): Promise<void> {
        const pinCorrecto = await autenticacion.verificarPin(
            PinTextoPlano.desde(pin),
            this.pinHasher,
        );
        await this.autenticacionRepo.guardar(autenticacion);

        if (!pinCorrecto) {
            throw new PinIncorrectoError();
        }
    }

    private async obtenerCuenta(tarjeta: Tarjeta): Promise<Cuenta> {
        const cuenta = await this.cuentaRepo.buscarPorId(tarjeta.obtenerIdCuenta());
        if (!cuenta) {
            throw new CuentaNoEncontradaError();
        }
        return cuenta;
    }

    private async ejecutarRetiroConPersistencia(args: {
        cuenta: Cuenta;
        monto: Dinero;
        idCajero: number;
    }): Promise<RetirarDineroResultado> {
        try {
            const { saldoAnterior, saldoNuevo } = args.cuenta.retirar(args.monto);

            const transaccion = await this.transaccionRepo.guardar(
                Transaccion.crear({
                    tipo: 'RETIRO',
                    monto: args.monto,
                    estado: 'EXITOSA',
                    idCajero: args.idCajero,
                }),
            );

            const movimiento = Movimiento.crear({
                tipo: 'RETIRO',
                monto: args.monto,
                saldoAnterior,
                saldoNuevo,
                idCuenta: args.cuenta.obtenerId()!,
                idTransaccion: transaccion.obtenerId()!,
            });

            await this.movimientoRepo.guardar(movimiento);
            await this.cuentaRepo.actualizar(args.cuenta);

            return {
                transaccion,
                movimiento,
                saldoNuevo,
            };
        } catch (error) {
            const saldoActual = args.cuenta.obtenerSaldo();
            const transaccionFallida = await this.transaccionRepo.guardar(
                Transaccion.crear({
                    tipo: 'RETIRO',
                    monto: args.monto,
                    estado: 'FALLIDA',
                    descripcion: error instanceof Error ? error.message : 'Error desconocido',
                    idCajero: args.idCajero,
                }),
            );

            const movimientoFallido = Movimiento.crear({
                tipo: 'RETIRO',
                monto: args.monto,
                saldoAnterior: saldoActual,
                saldoNuevo: saldoActual,
                idCuenta: args.cuenta.obtenerId()!,
                idTransaccion: transaccionFallida.obtenerId()!,
            });

            await this.movimientoRepo.guardar(movimientoFallido);
            throw error;
        }
    }
}