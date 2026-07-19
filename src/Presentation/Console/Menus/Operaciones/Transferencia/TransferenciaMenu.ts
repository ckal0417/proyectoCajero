import * as readline from "readline";
import { operacionesBancariasService } from "../../../../../Application/services/OperacionesBancariasService";
import { Consola } from "../../../../../shared/utils/Consola";
import { Formato } from "../../../../../shared/utils/Formato";
import { ResultadoOperacion } from "../../../../../Application/models/Resultado";

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
            async (numeroCuentaDestino: string) => {

                const numeroCuentaDestinoNormalizado = numeroCuentaDestino.trim();
                const titularResultado = await operacionesBancariasService.obtenerTitularCuenta(numeroCuentaDestinoNormalizado);

                if (!titularResultado.estado) {
                    Consola.error(ResultadoOperacion.obtenerMensajeError(titularResultado));
                    this.consola.question(
                        "\nPresione ENTER para continuar...",
                        () => callback()
                    );
                    return;
                }

                Consola.informacion(`Titular destino: ${titularResultado.valor.nombreCliente}`);

                this.consola.question(
                    "Ingrese el monto: ",
                    async (textoMonto: string) => {

                        const montoTransferencia =
                            Number(textoMonto);

                        const resultado = await operacionesBancariasService.transferir({
                            numeroTarjeta: this.numeroTarjeta,
                            numeroCuentaDestino: numeroCuentaDestinoNormalizado,
                            monto: montoTransferencia
                        });

                        if (resultado.estado) {
                            const body = resultado.valor.body as {
                                mensaje: string;
                                numeroCuentaOrigen: string;
                                numeroCuentaDestino: string;
                                nuevoSaldo: number;
                            };
                            Consola.exito(body.mensaje);
                            Consola.informacion(`Cuenta origen: ${body.numeroCuentaOrigen}`);
                            Consola.informacion(`Cuenta destino: ${body.numeroCuentaDestino}`);
                            Consola.informacion(`Saldo actual: ${Formato.dinero(body.nuevoSaldo)}`);
                        } else {
                            Consola.error(ResultadoOperacion.obtenerMensajeError(resultado));
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