import { Cuenta } from "../../../models/Cuenta";
import { TransferenciaLocalService } from "./TransferenciaLocalService";
import { TransferenciaInterbancariaService } from "./TransferenciaInterbancariaService";

export class TransferenciaService {

    constructor(

        private transferenciaLocal: TransferenciaLocalService,

        private transferenciaInterbancaria: TransferenciaInterbancariaService

    ) {}

    public transferir(

        cuentaOrigen: Cuenta,

        cuentaDestino: Cuenta | null,

        bancoDestino: string,

        numeroCuentaDestino: string,

        monto: number

    ): boolean {

        if (cuentaDestino) {

            this.transferenciaLocal.transferir(

                cuentaOrigen,

                cuentaDestino,

                monto

            );

            return true;

        }

        return this.transferenciaInterbancaria.transferir(

            cuentaOrigen,

            bancoDestino,

            numeroCuentaDestino,

            monto

        );

    }

}