import * as readline from "readline";
import { Cuenta } from "../../../../../../Application/models/Cuenta";
import { CajeroService } from "../../../../Services/CajeroService";
import { Consola } from "../../../../../../shared/utils/Consola";
import { TipoTransferencia } from "../../../../../../Domain/enums/TipoTransferencia";

export class TransferenciaInterbancariaMenu {

    constructor(
        private cuentaOrigen: Cuenta,
        private cajeroService: CajeroService,
        private consola: readline.Interface
    ) {}

    public iniciar(
        callback: () => void
    ): void {

        Consola.limpiar();
        Consola.titulo(
            "TRANSFERENCIA INTERBANCARIA"
        );

        this.consola.question(
            "Ingrese el banco destino: ",
            (bancoDestino: string) => {

                this.consola.question(
                    "Ingrese el número de la cuenta destino: ",
                    (numeroCuentaDestino: string) => {

                        this.consola.question(
                            "Ingrese el monto: ",
                            (textoMonto: string) => {

                                const montoTransferencia =
                                    Number(textoMonto);

                                this.cajeroService.ejecutar(
                                    "transferir",
                                    this.cuentaOrigen,
                                    TipoTransferencia.EXTERNA,
                                    bancoDestino,
                                    numeroCuentaDestino,
                                    montoTransferencia
                                );

                                this.consola.question(
                                    "\nPresione ENTER para continuar...",
                                    () => callback()
                                );
                            }
                        );
                    }
                );
            }
        );
    }
}