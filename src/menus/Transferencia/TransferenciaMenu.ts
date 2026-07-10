import * as readline from "readline";
import { Cuenta } from "../../models/Cuenta";
import { CajeroService } from "../../services/cajero/CajeroService";
import { Consola } from "../../utils/Consola";
import { TransferenciaLocalMenu } from "./local/TransferenciaLocalMenu";
import { TransferenciaInterbancariaMenu } from "./interbancaria/TransferenciaInterbancariaMenu";

export class TransferenciaMenu {

    constructor(
        private cuenta: Cuenta,
        private cajeroService: CajeroService,
        private consola: readline.Interface
    ) {}

    public iniciar(callback: () => void): void {

        Consola.limpiar();

        Consola.titulo("TRANSFERENCIAS");

        Consola.informacion("1. Transferencia Local");
        Consola.informacion("2. Transferencia Interbancaria");
        Consola.informacion("3. Volver\n");

        this.consola.question(

            "Seleccione una opción: ",

            (opcion: string) => {

                switch (opcion) {

                    case "1":

                        new TransferenciaLocalMenu(

                            this.cuenta,

                            this.cajeroService,

                            this.consola

                        ).iniciar(callback);

                        break;

                    case "2":

                        new TransferenciaInterbancariaMenu(

                            this.cuenta,

                            this.cajeroService,

                            this.consola

                        ).iniciar(callback);

                        break;

                    default:

                        callback();

                        break;

                }

            }

        );

    }

}