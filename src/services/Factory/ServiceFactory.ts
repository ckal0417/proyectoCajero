import { EventBus } from "../../events/EventBus";
import { CuentaRepository } from "../../repositories/CuentaRepository";
import { TransaccionRepository } from "../../repositories/TransaccionRepository";
import { DepositoService } from "../operaciones/deposito/DepositoService";
import { RetiroService } from "../operaciones/retiro/RetiroService";
import { SaldoService } from "../operaciones/saldo/SaldoService";
import { HistorialService } from "../operaciones/historial/HistorialService";
import { TransferenciaService } from "../operaciones/transferencia/TransferenciaService";
import { TransferenciaLocalService } from "../operaciones/transferencia/local/TransferenciaLocalService";
import { TransferenciaInterbancariaService } from "../operaciones/transferencia/interbancaria/TransferenciaInterbancariaService";
import { BancoIntermediarioService } from "../Intermediario/BancoIntermediarioService";

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