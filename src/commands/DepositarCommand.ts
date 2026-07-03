import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/consola";

export class DepositarCommand implements ICommand {

    public nombre: string = "depositar";

    public ejecutar(cuenta: Cuenta, monto?: number): void {

        if (monto === undefined || isNaN(monto)) {

            Consola.error("Debe ingresar un monto válido.");
            return;

        }

        cuenta.depositar(monto);

        Consola.exito("Depósito realizado correctamente.");

        Consola.informacion("");

        Consola.informacion(
            `Saldo actual: $${cuenta.consultarSaldo()}`
        );

    }

}