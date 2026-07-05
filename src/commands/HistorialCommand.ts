import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";

export class HistorialCommand implements ICommand {
    public nombre: string = "historial";

    public ejecutar(cuenta: Cuenta): void {
        Consola.titulo("HISTORIAL");

        const historial = cuenta.obtenerHistorial();

        if (historial.length === 0) {
            Consola.informacion("No existen movimientos todavía.");
            return;
        }

        historial.forEach(transaccion => {
            Consola.informacion(transaccion.mostrar());
        });
    }
}