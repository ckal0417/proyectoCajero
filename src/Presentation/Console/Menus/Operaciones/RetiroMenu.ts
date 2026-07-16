import * as readline from "readline";
import { operacionesBancariasService } from "../../../../Application/services/OperacionesBancariasService";
import { Consola } from "../../../../shared/utils/Consola";
import { Formato } from "../../../../shared/utils/Formato";

export class RetiroMenu {

    constructor(
        private numeroTarjeta: string,
        private consola: readline.Interface
    ) {}

    public iniciar(callback: () => void): void {

        Consola.limpiar();
        Consola.titulo("RETIRAR DINERO");

        this.consola.question(

            "Ingrese el monto: ",

            async (texto: string) => {

                const monto = Number(texto);

                const resultado = await operacionesBancariasService.retirar({
                    numeroTarjeta: this.numeroTarjeta,
                    monto
                });

                if (resultado.status === 200) {
                    const body = resultado.body as { mensaje: string; nuevoSaldo: number };
                    Consola.exito(body.mensaje);
                    Consola.informacion(`Saldo actual: ${Formato.dinero(body.nuevoSaldo)}`);
                } else {
                    Consola.error((resultado.body as { error: string }).error);
                }

                this.consola.question(

                    "\nPresione ENTER para continuar...",

                    () => callback()

                );

            }

        );

    }

}