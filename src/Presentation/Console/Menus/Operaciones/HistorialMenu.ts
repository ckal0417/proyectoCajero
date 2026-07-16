import * as readline from "readline";
import { operacionesBancariasService } from "../../../../Application/services/OperacionesBancariasService";
import { Consola } from "../../../../shared/utils/Consola";
import { Formato } from "../../../../shared/utils/Formato";

interface MovimientoHistorial {
    tipo: string;
    monto: number;
    fecha: Date;
}

export class HistorialMenu {

    constructor(
        private numeroTarjeta: string,
        private consola: readline.Interface
    ) {}

    public async iniciar(callback: () => void): Promise<void> {

        Consola.limpiar();

        Consola.titulo("HISTORIAL");

        const resultado = await operacionesBancariasService.obtenerHistorial(
            this.numeroTarjeta
        );

        if (resultado.status === 200) {

            const body = resultado.body as { historial: MovimientoHistorial[]; mensaje?: string };

            if (body.historial.length === 0) {
                Consola.informacion(body.mensaje ?? "No existen movimientos.");
            } else {
                body.historial.forEach((movimiento) => {
                    Consola.informacion(
                        `[${Formato.fecha(new Date(movimiento.fecha))}] ${movimiento.tipo} - ${Formato.dinero(movimiento.monto)}`
                    );
                });
            }

        } else {
            Consola.error((resultado.body as { error: string }).error);
        }

        this.consola.question(

            "\nPresione ENTER para continuar...",

            () => callback()

        );

    }

}