import * as readline from "readline";
import { CajeroService } from "../../../Application/services/CajeroService";
import { Cuenta } from "../../../Application/models/Cuenta";
import { Consola } from "../../../shared/utils/Consola";

export class HistorialMenu {

    constructor(
        private cuenta: Cuenta,
        private cajeroService: CajeroService,
        private consola: readline.Interface
    ) {}

    public iniciar(callback: () => void): void {

        Consola.limpiar();

        Consola.titulo("HISTORIAL");

        this.cajeroService.ejecutar(

            "historial",

            this.cuenta

        );

        this.consola.question(

            "\nPresione ENTER para continuar...",

            () => callback()

        );

    }

}