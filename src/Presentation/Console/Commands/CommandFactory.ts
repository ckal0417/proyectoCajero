import { CajeroService } from "../Services/CajeroService";
import { DepositoService } from "../../../Application/services/comandos/DepositoService";
import { RetiroService } from "../../../Application/services/comandos/RetiroService";
import { SaldoService } from "../../../Application/services/comandos/SaldoService";
import { HistorialService } from "../../../Application/services/comandos/HistorialService";
import { TransferenciaService } from "../../../Application/services/comandos/transferencia/TransferenciaService";
import { ConsultarSaldoCommand } from "./ConsultarSaldoCommand";
import { DepositarCommand } from "./DepositarCommand";
import { RetirarCommand } from "./RetirarCommand";
import { HistorialCommand } from "./HistorialCommand";
import { TransferirCommand } from "./TransferirCommand";

interface CajeroServicePort {
    registrarComando(comando: unknown): void;
}

export class CommandFactory {

    public static registrar(

        cajeroService: CajeroServicePort, // a quien se le va 

        services: { // La logica de negocio que implementa cada comando, se inyecta en el commandFactory para que los comandos puedan usarla.

            depositoService: DepositoService;

            retiroService: RetiroService;

            saldoService: SaldoService;

            historialService: HistorialService;

            transferenciaService: TransferenciaService;

        }

    ): void {

        cajeroService.registrarComando(

            new ConsultarSaldoCommand(

                services.saldoService

            )

        );

        cajeroService.registrarComando(

            new DepositarCommand(

                services.depositoService

            )

        );

        cajeroService.registrarComando(

            new RetirarCommand(

                services.retiroService

            )

        );

        cajeroService.registrarComando(

            new HistorialCommand(

                services.historialService

            )

        );

        cajeroService.registrarComando(

            new TransferirCommand(

                services.transferenciaService

            )

        );

    }

}