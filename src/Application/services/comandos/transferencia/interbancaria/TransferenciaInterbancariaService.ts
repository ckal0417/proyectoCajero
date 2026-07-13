import { Cuenta } from "../../../../models/Cuenta";
import { BancoIntermediarioService } from "../../../BancoIntermediarioService";

export class TransferenciaInterbancariaService {

    constructor(
        private bancoIntermediarioService: BancoIntermediarioService
    ) {}

    public transferir(
        cuentaOrigen: Cuenta,
        bancoDestino: string,
        numeroCuentaDestino: string,
        montoTransferencia: number
    ): boolean {

        const transferenciaAprobada =
            this.bancoIntermediarioService.procesarTransferencia(
                "Banco Principal",
                bancoDestino,
                cuentaOrigen.obtenerNumeroCuenta(),
                numeroCuentaDestino,
                montoTransferencia
            );

        if (!transferenciaAprobada) {
            return false;
        }

        cuentaOrigen.retirar(montoTransferencia);

        return true;
    }
}