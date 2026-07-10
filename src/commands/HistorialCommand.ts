import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { HistorialService } from "../services/operaciones/historial/HistorialService";

export class HistorialCommand implements ICommand {

    public nombre = "historial";

    constructor(
        private historialService: HistorialService
    ) {}

    public ejecutar(..._parametros: unknown[]): void {

        Consola.titulo("HISTORIAL");

        const resultado = this.historialService.ejecutar();

        if (!resultado.exitoso) {
            Consola.error(resultado.error);
            return;
        }

        if (resultado.valor.length === 0) {
            Consola.informacion("No existen movimientos.");
            return;
        }

        resultado.valor.forEach(transaccion => {
            Consola.informacion(
                transaccion.mostrar()
            );
        });

    }

}