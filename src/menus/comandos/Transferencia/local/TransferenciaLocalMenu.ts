import * as readline from "readline";
import { Cuenta } from "../../../../Domain/Entities/Cuenta";
import { CajeroService } from "../../../../Application/services/CajeroService";
import { Consola } from "../../../../shared/utils/Consola";

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

                            "LOCAL",

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