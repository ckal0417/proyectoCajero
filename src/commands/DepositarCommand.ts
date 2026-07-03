import { ICommand } from "./ICommand";
import { Cuenta } from "../models/Cuenta";

export class DepositarCommand implements ICommand {
  public nombre: string = "depositar";

  ejecutar(cuenta: Cuenta, monto?: number): void {
    if (monto === undefined || isNaN(monto)) {
      console.log("Debes ingresar un monto válido.");
      return;
    }

    cuenta.depositar(monto);
    console.log(`Depósito realizado: $${monto}`);
  }
}