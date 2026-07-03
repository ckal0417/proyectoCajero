import { ICommand } from "./ICommand";
import { Cuenta } from "../models/Cuenta";

export class ConsultarSaldoCommand implements ICommand {
  public nombre: string = "saldo";

  ejecutar(cuenta: Cuenta): void {
    const saldo = cuenta.consultarSaldo();
    console.log(`Saldo actual: $${saldo}`);
  }
}