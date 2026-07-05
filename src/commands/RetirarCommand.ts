import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { Validaciones } from "../utils/Validaciones";
import { Formato } from "../utils/Formato";

export class RetirarCommand implements ICommand {
    public nombre: string = "retirar";

    public ejecutar(cuenta: Cuenta, monto?: number): void {
        const montoValido = Validaciones.obtenerMontoValido(monto);

        cuenta.retirar(montoValido);

        Consola.exito("Retiro realizado correctamente.");
        Consola.informacion("");
        Consola.informacion(`Saldo actual: ${Formato.dinero(cuenta.obtenerSaldo())}`);
    }
}