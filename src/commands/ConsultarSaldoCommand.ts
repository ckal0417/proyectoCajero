import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { Formato } from "../utils/Formato";

export class ConsultarSaldoCommand implements ICommand {
    public nombre: string = "saldo";

    public ejecutar(cuenta: Cuenta): void {
        Consola.titulo("CONSULTAR SALDO");

        const saldo = cuenta.consultarSaldo();

        Consola.informacion(`Cuenta: ${cuenta.obtenerNumeroCuenta()}`);
        Consola.informacion(`Saldo actual: ${Formato.dinero(saldo)}`);
    }
}