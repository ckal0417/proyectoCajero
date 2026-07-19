import * as readline from "readline";
import { Cuenta } from "../../../../../../Application/models/Cuenta";
import { CajeroService } from "../../../../Services/CajeroService";
import { Consola } from "../../../../../../shared/utils/Consola";
import { TipoTransferencia } from "../../../../../../Domain/enums/TipoTransferencia";

export class TransferenciaLocalMenu {

    constructor(
        private cuenta: Cuenta,
        private cajeroService: CajeroService,
        private consola: readline.Interface
    ) {}

    public iniciar(callback: () => void): void {

        Consola.limpiar();
        Consola.titulo("TRANSFERENCIA LOCAL");

        this.consola.question(

            "Ingrese la cuenta destino: ",

            (cuentaDestino: string) => {

                this.consola.question(

                    "Ingrese el monto: ",

                    (texto: string) => {

                        const monto = Number(texto);

                        this.cajeroService.ejecutar(

                            "transferir",

                            this.cuenta,

                            TipoTransferencia.INTERNA,

                            cuentaDestino,

                            monto

                        );

                        this.consola.question(

                            "\nPresione ENTER para continuar...",

                            () => callback()

                        );

                    }

                );

            }

        );

    }

}