import { ICommand } from "../interfaces/ICommand";
import { Cuenta } from "../models/Cuenta";
import { Consola } from "../utils/Consola";
import { TransferenciaService } from "../services/operaciones/transferencia/TransferenciaService";
import { TipoTransferencia } from "../enums/TipoTransferencia";

export class TransferirCommand implements ICommand {

    public nombre: string = "transferir";

    constructor(
        private transferenciaService: TransferenciaService
    ) {}

    public ejecutar(
        ...parametros: unknown[]
    ): void {

        const cuentaOrigen = parametros[0] as Cuenta;
        const tipoTransferencia =
            parametros[1] as TipoTransferencia;

        if (tipoTransferencia === TipoTransferencia.LOCAL) {

            const numeroCuentaDestino =
                parametros[2] as string;

            const montoTransferencia =
                parametros[3] as number;

            const resultado =
                this.transferenciaService.realizarTransferenciaLocal(
                    cuentaOrigen.obtenerNumeroCuenta(),
                    numeroCuentaDestino,
                    montoTransferencia
                );

            this.mostrarResultado(resultado);

            return;
        }

        if (
            tipoTransferencia ===
            TipoTransferencia.INTERBANCARIA
        ) {

            const bancoDestino =
                parametros[2] as string;

            const numeroCuentaDestino =
                parametros[3] as string;

            const montoTransferencia =
                parametros[4] as number;

            const resultado =
                this.transferenciaService
                    .realizarTransferenciaInterbancaria(
                        cuentaOrigen.obtenerNumeroCuenta(),
                        bancoDestino,
                        numeroCuentaDestino,
                        montoTransferencia
                    );

            this.mostrarResultado(resultado);

            return;
        }

        Consola.error(
            "El tipo de transferencia no es válido."
        );
    }

    private mostrarResultado(
        resultado: {
            estado: boolean;
            error?: string;
        }
    ): void {

        if (!resultado.estado) {
            Consola.error(
                resultado.error ??
                "No fue posible realizar la transferencia."
            );

            return;
        }

        Consola.exito(
            "Transferencia realizada correctamente."
        );
    }
}