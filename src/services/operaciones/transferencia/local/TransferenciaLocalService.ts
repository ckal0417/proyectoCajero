import { Cuenta } from "../../../../models/Cuenta";

export class TransferenciaLocalService {

    public transferir(
        cuentaOrigen: Cuenta,
        cuentaDestino: Cuenta,
        montoTransferencia: number
    ): void {

        cuentaOrigen.retirar(montoTransferencia);

        cuentaDestino.depositar(montoTransferencia);
    }
}