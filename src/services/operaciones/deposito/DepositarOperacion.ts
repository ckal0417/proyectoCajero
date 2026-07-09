import { Resultado, ResultadoOperacion } from "../../../common/Resultado";
import { CuentaRepository } from "../../../repositories/CuentaRepository";
import { EventBus } from "../../../events/EventBus";
import { TiposEvento } from "../../../events/TiposEvento";
import { Transaccion } from "../../../models/Transaccion";
import { TipoTransaccion } from "../../../enums/TipoTransaccion";

export class DepositarOperacion {
    constructor(
        private cuentaRepository: CuentaRepository,
        private eventBus: EventBus
    ) {}

    public ejecutar(
        numeroCuenta: string,
        monto: number
    ): Resultado<void> {
        const cuenta = this.cuentaRepository.obtenerPorNumero(numeroCuenta);

        if (!cuenta) {
            return ResultadoOperacion.fallido("Cuenta no encontrada.");
        }

        cuenta.depositar(monto);

        this.cuentaRepository.actualizarSaldo(
            numeroCuenta,
            cuenta.obtenerSaldo()
        );

        const transaccion = new Transaccion(
            TipoTransaccion.DEPOSITO,
            monto,
            new Date(),
            "Depósito realizado"
        );

        this.eventBus.publicar({
            nombre: TiposEvento.DEPOSITO_REALIZADO,
            datos: transaccion
        });

        return ResultadoOperacion.exitoso(undefined);
    }
}