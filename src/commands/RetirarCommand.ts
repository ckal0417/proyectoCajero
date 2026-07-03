import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/consola";

export class RetirarCommand implements ICommand {

    public nombre: string = "retirar";

    public ejecutar(cuenta: Cuenta, monto?: number): void {

        if (monto === undefined || isNaN(monto)) {

            Consola.error("Debe ingresar un monto válido.");
            return;

        }

        try {

            cuenta.retirar(monto);

            Consola.exito("Retiro realizado correctamente.");

            Consola.informacion("");

            Consola.informacion(
                `Saldo actual: $${cuenta.consultarSaldo()}`
            );

        }
        catch (error) {

            Consola.error((error as Error).message);

        }

    }

}