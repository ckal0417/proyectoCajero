import * as readline from "readline";
import { Consola } from "../../../../../shared/utils/Consola";
import { Formato } from "../../../../../shared/utils/Formato";
import { ResultadoOperacion } from "../../../../../Application/models/Resultado";
import { operacionesBancariasService } from "../../../../../bootstrap/services";

export class TransferenciaMenu {

    constructor(
        private numeroTarjeta: string,
        private consola: readline.Interface
    ) { }

    public iniciar(
        callback: () => void
    ): void {

        Consola.limpiar();
        Consola.titulo("TRANSFERENCIAS");

        this.consola.question(
            "Tipo de transferencia (1=INTERNA, 2=EXTERNA): ",
            (tipoTexto: string) => {
                const tipoTransferencia = tipoTexto.trim() === '2' ? 'EXTERNA' : 'INTERNA';
                this.pedirCuentaDestino(tipoTransferencia, callback);
            }
        );
    }

    private pedirCuentaDestino(tipoTransferencia: 'INTERNA' | 'EXTERNA', callback: () => void): void {

        this.consola.question(
            "Ingrese el número de la cuenta destino: ",
            async (numeroCuentaDestino: string) => {

                const numeroCuentaDestinoNormalizado = numeroCuentaDestino.trim();

                if (tipoTransferencia === 'INTERNA') {
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
                    this.pedirMonto(tipoTransferencia, numeroCuentaDestinoNormalizado, callback);
                    return;
                }

                this.consola.question(
                    "Ingrese el banco destino: ",
                    (bancoDestino: string) => {
                        this.pedirMonto(tipoTransferencia, numeroCuentaDestinoNormalizado, callback, bancoDestino.trim());
                    }
                );
            }
        );
    }

    private pedirMonto(
        tipoTransferencia: 'INTERNA' | 'EXTERNA',
        numeroCuentaDestino: string,
        callback: () => void,
        bancoDestino?: string,
    ): void {
        this.consola.question(
            "Ingrese el monto: ",
            async (textoMonto: string) => {
                const montoTransferencia = Number(textoMonto);

                const resultado = await operacionesBancariasService.transferir({
                    numeroTarjeta: this.numeroTarjeta,
                    tipoTransferencia,
                    bancoDestino,
                    numeroCuentaDestino,
                    monto: montoTransferencia,
                });

                if (resultado.estado) {
                    const body = resultado.valor.body as {
                        mensaje: string;
                        numeroCuentaOrigen?: string;
                        numeroCuentaDestino?: string;
                        nuevoSaldo?: number;
                        referenciaExterna?: string;
                        estado?: string;
                    };
                    Consola.exito(body.mensaje);
                    if (body.numeroCuentaOrigen) Consola.informacion(`Cuenta origen: ${body.numeroCuentaOrigen}`);
                    if (body.numeroCuentaDestino) Consola.informacion(`Cuenta destino: ${body.numeroCuentaDestino}`);
                    if (body.referenciaExterna) Consola.informacion(`Referencia: ${body.referenciaExterna}`);
                    if (body.estado) Consola.informacion(`Estado: ${body.estado}`);
                    if (body.nuevoSaldo !== undefined) Consola.informacion(`Saldo actual: ${Formato.dinero(body.nuevoSaldo)}`);
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
}