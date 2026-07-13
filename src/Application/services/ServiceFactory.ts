import { EventBus } from "../../shared/events/EventBus";
import { CuentaRepository } from "../../Infrastructure/repositories/CuentaRepository";
import { TransaccionRepository } from "../../Infrastructure/repositories/TransaccionRepository";
import { DepositoService } from "./comandos/DepositoService";
import { RetiroService } from "./comandos/RetiroService";
import { SaldoService } from "./comandos/SaldoService";
import { HistorialService } from "./comandos/HistorialService";
import { TransferenciaService } from "./comandos/transferencia/TransferenciaService";
import { TransferenciaLocalService } from "./comandos/transferencia/local/TransferenciaLocalService";
import { TransferenciaInterbancariaService } from "./comandos/transferencia/interbancaria/TransferenciaInterbancariaService";
import { BancoIntermediarioService } from "./BancoIntermediarioService";

export class ServiceFactory {

    public static crear(

        cuentaRepository: CuentaRepository,

        transaccionRepository: TransaccionRepository,

        eventBus: EventBus

    ) {

        const depositoService =
            new DepositoService(
                cuentaRepository,
                eventBus
            );

        const retiroService =
            new RetiroService(
                cuentaRepository,
                eventBus
            );

        const saldoService =
            new SaldoService(
                cuentaRepository
            );

        const historialService =
            new HistorialService(
                transaccionRepository
            );

        const bancoIntermediarioService =
            new BancoIntermediarioService();

        const transferenciaLocalService =
            new TransferenciaLocalService();

        const transferenciaInterbancariaService =
            new TransferenciaInterbancariaService(
                bancoIntermediarioService
            );

        const transferenciaService =
            new TransferenciaService(
                cuentaRepository,
                transferenciaLocalService,
                transferenciaInterbancariaService,
                eventBus
            );

        return {

            depositoService,

            retiroService,

            saldoService,

            historialService,

            transferenciaService

        };

    }

}