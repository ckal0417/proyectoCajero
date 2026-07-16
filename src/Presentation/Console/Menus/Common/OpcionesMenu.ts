import * as readline from "readline";
import { Consola } from "../../../../shared/utils/Consola";

export class OpcionesMenu {

    constructor(
        private consola: readline.Interface
    ) {}

    public mostrar(
        callback: (opcion: string) => void
    ): void {

        Consola.informacion("1. Consultar saldo");
        Consola.informacion("2. Depositar dinero");
        Consola.informacion("3. Retirar dinero");
        Consola.informacion("4. Ver historial");
        Consola.informacion("5. Transferencias");
        Consola.informacion("6. Salir");        
        Consola.informacion("");

        this.consola.question(

            "Seleccione una opción: ",

            (opcion: string) => {

                callback(opcion);

            }

        );

    }

}