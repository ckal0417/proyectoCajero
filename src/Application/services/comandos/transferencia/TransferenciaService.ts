
import { TransferenciaLocalService } from "./local/TransferenciaLocalService";
import { TransferenciaInterbancariaService } from "./interbancaria/TransferenciaInterbancariaService";
import { EventBus } from "../../../../shared/events/EventBus";
import { TiposEvento } from "../../../../shared/events/TiposEvento";
import { TipoTransaccion } from "../../../../Domain/enums/TipoTransaccion";
import { TransferenciaValidacion } from "../../../../shared/utils/validaciones/TransferenciaValidacion";
import { CuentaRepository } from "../../../../Infrastructure/Database/Repositories/CuentaRepository";
import { Transaccion } from "../../../models/Transaccion";
import { Resultado, ResultadoOperacion } from "../../../models/Resultado";

export class TransferenciaService {

    constructor(
        private cuentaRepository: CuentaRepository,
        private transferenciaLocalService: TransferenciaLocalService,
        private transferenciaInterbancariaService: TransferenciaInterbancariaService,
        private eventBus: EventBus
    ) {}

    public realizarTransferenciaLocal(
        numeroCuentaOrigen: string,
        numeroCuentaDestino: string,
        montoTransferencia: number
    ): Resultado<void> {

        const validacion = TransferenciaValidacion.validar(
            numeroCuentaDestino,
            montoTransferencia
        );

        if (!validacion.estado) {
            return ResultadoOperacion.fallido(
                validacion.error
            );
        }

        if (numeroCuentaOrigen === numeroCuentaDestino) {
            return ResultadoOperacion.fallido(
                "La cuenta destino no puede ser igual a la cuenta origen."
            );
        }

        const cuentaOrigen =
            this.cuentaRepository.obtenerPorNumero(
                numeroCuentaOrigen
            );

        if (!cuentaOrigen) {
            return ResultadoOperacion.fallido(
                "La cuenta origen no fue encontrada."
            );
        }

        const cuentaDestino =
            this.cuentaRepository.obtenerPorNumero(
                numeroCuentaDestino
            );

        if (!cuentaDestino) {
            return ResultadoOperacion.fallido(
                "La cuenta destino no fue encontrada en el banco."
            );
        }

        if (montoTransferencia > cuentaOrigen.obtenerSaldo()) {
            return ResultadoOperacion.fallido(
                "Saldo insuficiente."
            );
        }

        this.transferenciaLocalService.transferir(
            cuentaOrigen,
            cuentaDestino,
            montoTransferencia
        );

        this.cuentaRepository.actualizarSaldo(
            numeroCuentaOrigen,
            cuentaOrigen.obtenerSaldo()
        );

        this.cuentaRepository.actualizarSaldo(
            numeroCuentaDestino,
            cuentaDestino.obtenerSaldo()
        );

        const transaccion = new Transaccion(
            TipoTransaccion.TRANSFERENCIA,
            montoTransferencia,
            new Date(),
            `Transferencia local a la cuenta ${numeroCuentaDestino}`
        );

        this.eventBus.publicar({
            nombre: TiposEvento.TRANSFERENCIA_REALIZADA,
            datos: transaccion
        });

        return ResultadoOperacion.exitoso(undefined);
    }

    public realizarTransferenciaInterbancaria(
        numeroCuentaOrigen: string,
        bancoDestino: string,
        numeroCuentaDestino: string,
        montoTransferencia: number
    ): Resultado<void> {

        const validacion = TransferenciaValidacion.validar(
            numeroCuentaDestino,
            montoTransferencia
        );

        if (!validacion.estado) {
            return ResultadoOperacion.fallido(
                validacion.error
            );
        }

        if (bancoDestino.trim().length === 0) {
            return ResultadoOperacion.fallido(
                "Debe ingresar el banco destino."
            );
        }

        const cuentaOrigen =
            this.cuentaRepository.obtenerPorNumero(
                numeroCuentaOrigen
            );

        if (!cuentaOrigen) {
            return ResultadoOperacion.fallido(
                "La cuenta origen no fue encontrada."
            );
        }

        if (montoTransferencia > cuentaOrigen.obtenerSaldo()) {
            return ResultadoOperacion.fallido(
                "Saldo insuficiente."
            );
        }

        const transferenciaRealizada =
            this.transferenciaInterbancariaService.transferir(
                cuentaOrigen,
                bancoDestino,
                numeroCuentaDestino,
                montoTransferencia
            );

        if (!transferenciaRealizada) {
            return ResultadoOperacion.fallido(
                "El intermediario rechazó la transferencia."
            );
        }

        this.cuentaRepository.actualizarSaldo(
            numeroCuentaOrigen,
            cuentaOrigen.obtenerSaldo()
        );

        const transaccion = new Transaccion(
            TipoTransaccion.TRANSFERENCIA,
            montoTransferencia,
            new Date(),
            `Transferencia interbancaria a ${bancoDestino}, cuenta ${numeroCuentaDestino}`
        );

        this.eventBus.publicar({
            nombre: TiposEvento.TRANSFERENCIA_REALIZADA,
            datos: transaccion
        });

        return ResultadoOperacion.exitoso(undefined);
    }
}