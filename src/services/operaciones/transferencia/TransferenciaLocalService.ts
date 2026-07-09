import { Cuenta } from "../../../models/Cuenta";

export class TransferenciaLocalService {

    public transferir(
        cuentaOrigen: Cuenta,
        cuentaDestino: Cuenta,
        monto: number
    ): void {

        cuentaOrigen.retirar(monto);

        cuentaDestino.depositar(monto);

    }

}