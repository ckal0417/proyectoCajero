import { Cuenta } from "../../../../models/Cuenta";

interface BancoIntermediarioPort {
    procesarTransferencia(
        bancoOrigen: string,
        bancoDestino: string,
        numeroCuentaOrigen: string,
        numeroCuentaDestino: string,
        montoTransferencia: number
    ): boolean;
}

export class TransferenciaInterbancariaService {

    constructor(
        private bancoIntermediarioService: BancoIntermediarioPort
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