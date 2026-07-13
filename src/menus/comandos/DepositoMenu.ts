import * as readline from "readline";
import { CajeroService } from "../../Application/services/CajeroService";
import { Cuenta } from "../../Application/models/Cuenta";
import { Consola } from "../../shared/utils/Consola";

export class DepositoMenu {

    constructor(
        private cuenta: Cuenta,
        private cajeroService: CajeroService,
        private consola: readline.Interface
    ) {}

    public iniciar(callback: () => void): void {

        Consola.limpiar();
        Consola.titulo("DEPOSITAR DINERO");

        this.consola.question(

            "Ingrese el monto: ",

            (texto: string) => {

                const monto = Number(texto);

                this.cajeroService.ejecutar(

                    "depositar",

                    this.cuenta,

                    monto

                );

                this.consola.question(

                    "\nPresione ENTER para continuar...",

                    () => callback()

                );

            }

        );

    }

}