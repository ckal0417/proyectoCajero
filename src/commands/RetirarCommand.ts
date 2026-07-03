import { ICommand } from "./ICommand";
import { Cuenta } from "../models/Cuenta";

export class RetirarCommand implements ICommand {
  public nombre: string = "retirar";

  ejecutar(cuenta: Cuenta, monto?: number): void {
    if (monto === undefined || isNaN(monto)) {
      console.log("Debes ingresar un monto válido.");
      return;
    }

    cuenta.retirar(monto);
    console.log(`Retiro realizado: $${monto}`);
  }
}