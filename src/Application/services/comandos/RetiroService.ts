
import { EventBus } from "../../../shared/events/EventBus";
import { TiposEvento } from "../../../shared/events/TiposEvento";
import { Transaccion } from "../../../Domain/Entities/Transaccion";
import { TipoTransaccion } from "../../../Domain/enums/TipoTransaccion";
import { CuentaRepository } from "../../../Infrastructure/Database/Repositories/CuentaRepository";
import { Resultado, ResultadoOperacion } from "../../models/Resultado";
import { Dinero } from "../../../Domain/Value-Objects/Dinero";
import { EstadoTransaccion } from "../../../Domain/enums/EstadoTransaccion";

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

        const transaccion = Transaccion.crear({
            tipo: TipoTransaccion.RETIRO,
            monto: Dinero.desde(monto),
            estado: EstadoTransaccion.EXITOSA,
            descripcion: "Retiro realizado",
        });

        this.eventBus.publicar({
            nombre: TiposEvento.RETIRO_REALIZADO,
            datos: transaccion
        });

        return ResultadoOperacion.exitoso(undefined);
    }
}