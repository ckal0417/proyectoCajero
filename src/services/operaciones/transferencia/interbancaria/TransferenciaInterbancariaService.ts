import { Cuenta } from "../../../../models/Cuenta";
import { BancoIntermediarioService } from "../../../Intermediario/BancoIntermediarioService";
export class TransferenciaInterbancariaService {

    constructor(
        private bancoIntermediarioService: BancoIntermediarioService
    ) {}

    public transferir(
        cuentaOrigen: Cuenta,
        bancoDestino: string,
        numeroCuentaDestino: string,
        monto: number
    ): boolean {

        cuentaOrigen.retirar(monto);

        return this.bancoIntermediarioService.procesarTransferencia(
            "Banco Principal",
            bancoDestino,
            cuentaOrigen.obtenerNumeroCuenta(),
            numeroCuentaDestino,
            monto
        );

    }

}