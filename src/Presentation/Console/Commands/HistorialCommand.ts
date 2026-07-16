import { ICommand } from "../Interfaces/ICommand";
import { Consola } from "../../../shared/utils/Consola";
import { HistorialService } from "../../../Application/services/comandos/HistorialService";

export class HistorialCommand implements ICommand {

    public nombre = "historial";

    constructor(
        private historialService: HistorialService
    ) {}

    public ejecutar(..._parametros: unknown[]): void {

        const resultado = this.historialService.ejecutar();

        if (!resultado.estado) {
            Consola.error(resultado.error);
            return;
        }

        if (resultado.valor.length === 0) {
            Consola.informacion("No existen movimientos.");
            return;
        }

        resultado.valor.forEach((transaccion: { mostrar: () => string; }) => {
            Consola.informacion(
                transaccion.mostrar()
            );
        });
    }
}