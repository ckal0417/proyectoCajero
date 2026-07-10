import { CajeroService } from "../services/CajeroService";
import { DepositoService } from "../services/comandos/DepositoService";
import { RetiroService } from "../services/comandos/RetiroService";
import { SaldoService } from "../services/comandos/SaldoService";
import { HistorialService } from "../services/comandos/HistorialService";
import { TransferenciaService } from "../services/comandos/transferencia/TransferenciaService";
import { ConsultarSaldoCommand } from "./ConsultarSaldoCommand";
import { DepositarCommand } from "./DepositarCommand";
import { RetirarCommand } from "./RetirarCommand";
import { HistorialCommand } from "./HistorialCommand";
import { TransferirCommand } from "./TransferirCommand";

export class CommandFactory {

    public static registrar(

        cajeroService: CajeroService,

        services: {

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