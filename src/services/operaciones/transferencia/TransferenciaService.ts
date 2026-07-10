import { Cuenta } from "../../../models/Cuenta";
import { TransferenciaLocalService } from "./local/TransferenciaLocalService";
import { TransferenciaInterbancariaService } from "./interbancaria/TransferenciaInterbancariaService";

export class TransferenciaService {

    constructor(
        private transferenciaLocalService: TransferenciaLocalService,
        private transferenciaInterbancariaService: TransferenciaInterbancariaService
    ) {}

    public realizarTransferenciaLocal(
        cuentaOrigen: Cuenta,
        cuentaDestino: Cuenta,
        monto: number
    ): boolean {

        this.transferenciaLocalService.transferir(
            cuentaOrigen,
            cuentaDestino,
            monto
        );

        return true;

    }

    public realizarTransferenciaInterbancaria(
        cuentaOrigen: Cuenta,
        bancoDestino: string,
        numeroCuentaDestino: string,
        monto: number
    ): boolean {

        return this.transferenciaInterbancariaService.transferir(
            cuentaOrigen,
            bancoDestino,
            numeroCuentaDestino,
            monto
        );

    }

}