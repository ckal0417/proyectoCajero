import { Cuenta } from "../../../models/Cuenta";
import { BancoIntermediarioService } from "./BancoIntermediarioService";

export class TransferenciaInterbancariaService {

    constructor(

        private bancoIntermediario: BancoIntermediarioService

    ) {}

    public transferir(

        cuentaOrigen: Cuenta,

        bancoDestino: string,

        numeroCuentaDestino: string,

        monto: number

    ): boolean {

        cuentaOrigen.retirar(monto);

        return this.bancoIntermediario.procesarTransferencia(

            "Banco Principal",

            bancoDestino,

            cuentaOrigen.obtenerNumeroCuenta(),

            numeroCuentaDestino,

            monto

        );

    }

}