import { Resultado, ResultadoOperacion } from "../../models/Resultado";
import { CuentaRepository } from "../../../Infrastructure/repositories/CuentaRepository";
import { EventBus } from "../../../shared/events/EventBus";
import { TiposEvento } from "../../../shared/events/TiposEvento";
import { Transaccion } from "../../models/Transaccion";
import { TipoTransaccion } from "../../../Domain/enums/TipoTransaccion";

export class DepositoService {
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