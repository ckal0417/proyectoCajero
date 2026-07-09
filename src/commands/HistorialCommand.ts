import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { ConsultarHistorialOperacion } from "../services/operaciones/historial/ConsultarHistorialOperacion";

export class HistorialCommand implements ICommand {
    public nombre: string = "historial";

    constructor(
        private operacion: ConsultarHistorialOperacion
    ) {}

    public ejecutar(_cuenta: Cuenta): void {
        Consola.titulo("HISTORIAL");

        const resultado = this.operacion.ejecutar();

        if (!resultado.exitoso) {
            Consola.error(resultado.error);
            return;
        }

        if (resultado.valor.length === 0) {
            Consola.informacion("No existen movimientos todavía.");
            return;
        }

        resultado.valor.forEach(transaccion => {
            Consola.informacion(transaccion.mostrar());
        });
    }
}