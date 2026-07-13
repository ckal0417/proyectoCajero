import { Resultado, ResultadoOperacion } from "../../models/Resultado";
import { CuentaRepository } from "../../../Infrastructure/repositories/CuentaRepository";
import { EventBus } from "../../../shared/events/EventBus";
import { TiposEvento } from "../../../shared/events/TiposEvento";
import { Transaccion } from "../../models/Transaccion";
import { TipoTransaccion } from "../../../Domain/enums/TipoTransaccion";

export class RetiroService {
    constructor(
        private cuentaRepository: CuentaRepository,
        private eventBus: EventBus
    ) {}

    public ejecutar(numeroCuenta: string, monto: number): Resultado<void> {
        const cuenta = this.cuentaRepository.obtenerPorNumero(numeroCuenta);

        if (!cuenta) {
            return ResultadoOperacion.fallido("Cuenta no encontrada.");
        }

        if (monto > cuenta.obtenerSaldo()) {
            return ResultadoOperacion.fallido("Saldo insuficiente.");
        }

        cuenta.retirar(monto);

        this.cuentaRepository.actualizarSaldo(
            numeroCuenta,
            cuenta.obtenerSaldo()
        );

        const transaccion = new Transaccion(
            TipoTransaccion.RETIRO,
            monto,
            new Date(),
            "Retiro realizado"
        );

        this.eventBus.publicar({
            nombre: TiposEvento.RETIRO_REALIZADO,
            datos: transaccion
        });

        return ResultadoOperacion.exitoso(undefined);
    }
}