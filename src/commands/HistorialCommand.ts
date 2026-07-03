import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/consola";

export class HistorialCommand implements ICommand {

    public nombre: string = "historial";

    public ejecutar(cuenta: Cuenta): void {

        Consola.titulo("HISTORIAL DE TRANSACCIONES");

        const historial = cuenta.obtenerHistorial();

        if (historial.length === 0) {

            Consola.informacion("Todavía no existen movimientos.");

            return;

        }

        historial.forEach(transaccion => {

            Consola.informacion(
                transaccion.mostrar()
            );

        });

    }

}