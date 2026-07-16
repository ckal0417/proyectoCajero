import * as readline from "readline";
import { operacionesBancariasService } from "../../../../../Application/services/OperacionesBancariasService";
import { Consola } from "../../../../../shared/utils/Consola";
import { Formato } from "../../../../../shared/utils/Formato";

export class TransferenciaMenu {

    constructor(
        private numeroTarjeta: string,
        private consola: readline.Interface
    ) {}

    public iniciar(
        callback: () => void
    ): void {

        Consola.limpiar();
        Consola.titulo("TRANSFERENCIA LOCAL");

        this.consola.question(
            "Ingrese el número de la cuenta destino: ",
            (numeroCuentaDestino: string) => {

                this.consola.question(
                    "Ingrese el monto: ",
                    async (textoMonto: string) => {

                        const montoTransferencia =
                            Number(textoMonto);

                        const resultado = await operacionesBancariasService.transferir({
                            numeroTarjeta: this.numeroTarjeta,
                            numeroCuentaDestino,
                            monto: montoTransferencia
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
        );
    }
}