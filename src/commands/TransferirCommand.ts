import { ICommand } from "../interfaces/ICommand";
import { Cuenta } from "../models/Cuenta";
import { Consola } from "../utils/Consola";
import { TransferenciaService } from "../services/operaciones/transferencia/TransferenciaService";

export class TransferirCommand implements ICommand {

    public nombre = "transferir";

    constructor(
        private transferenciaService: TransferenciaService
    ) {}

    public ejecutar(
        cuentaOrigen: Cuenta,
        cuentaDestino: Cuenta | null,
        bancoDestino: string,
        numeroCuentaDestino: string,
        monto: number
    ): void {

        let realizada = false;

        if (cuentaDestino) {

            realizada = this.transferenciaService.realizarTransferenciaLocal(

                cuentaOrigen,

                cuentaDestino,

                monto

            );

        } else {

            realizada = this.transferenciaService.realizarTransferenciaInterbancaria(

                cuentaOrigen,

                bancoDestino,

                numeroCuentaDestino,

                monto

            );

        }

        if (realizada) {

            Consola.exito("Transferencia realizada correctamente.");

        } else {

            Consola.error("No fue posible realizar la transferencia.");

        }

    }

}