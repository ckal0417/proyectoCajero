
import { EventBus } from "../../../shared/events/EventBus";
import { TiposEvento } from "../../../shared/events/TiposEvento";
import { TipoTransaccion } from "../../../Domain/enums/TipoTransaccion";
import { Resultado, ResultadoOperacion } from "../../models/Resultado";
import { CuentaRepository } from "../../../Infrastructure/Database/Repositories/CuentaRepository";
import { Transaccion } from "../../../Domain/Entities/Transaccion";
import { Dinero } from "../../../Domain/Value-Objects/Dinero";
import { EstadoTransaccion } from "../../../Domain/enums/EstadoTransaccion";

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

        const transaccion = Transaccion.crear({
            tipo: TipoTransaccion.DEPOSITO,
            monto: Dinero.desde(monto),
            estado: EstadoTransaccion.EXITOSA,
            descripcion: "Depósito realizado",
        });

        this.eventBus.publicar({
            nombre: TiposEvento.DEPOSITO_REALIZADO,
            datos: transaccion
        });

        return ResultadoOperacion.exitoso(undefined);
    }
}