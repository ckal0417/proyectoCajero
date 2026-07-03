import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/consola";

export class ConsultarSaldoCommand implements ICommand {

    public nombre: string = "saldo";

    public ejecutar(cuenta: Cuenta): void {

        Consola.titulo("CONSULTAR SALDO");

        Consola.informacion(
            `Titular: ${cuenta.obtenerTitular()}`
        );

        Consola.informacion(
            `Cuenta: ${cuenta.obtenerNumeroCuenta()}`
        );

        Consola.informacion("");

        Consola.informacion(
            `Saldo actual: $${cuenta.consultarSaldo()}`
        );

    }

}