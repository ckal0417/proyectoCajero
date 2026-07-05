import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { Validaciones } from "../utils/Validaciones";
import { Formato } from "../utils/Formato";

export class DepositarCommand implements ICommand {
    public nombre: string = "depositar";

    public ejecutar(cuenta: Cuenta, monto?: number): void {
        const montoValido = Validaciones.obtenerMontoValido(monto);

        cuenta.depositar(montoValido);

        Consola.exito("Depósito realizado correctamente.");
        Consola.informacion("");
        Consola.informacion(`Saldo actual: ${Formato.dinero(cuenta.obtenerSaldo())}`);
    }
}