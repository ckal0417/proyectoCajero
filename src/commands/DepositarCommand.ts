import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { Formato } from "../utils/Formato";
import { MontoValidacion } from "../utils/validaciones/MontoValidacion";
import { DepositarOperacion } from "../services/operaciones/deposito/DepositarOperacion";

export class DepositarCommand implements ICommand {
    public nombre: string = "depositar";

    constructor(
        private operacion: DepositarOperacion
    ) {}

    public ejecutar(cuenta: Cuenta, monto?: number): void {
        const validacion = MontoValidacion.validar(monto);

        if (!validacion.exitoso) {
            Consola.error(validacion.error);
            return;
        }

        const resultado = this.operacion.ejecutar(
            cuenta.obtenerNumeroCuenta(),
            validacion.valor
        );

        if (!resultado.exitoso) {
            Consola.error(resultado.error);
            return;
        }

        Consola.exito("Depósito realizado correctamente.");
        Consola.informacion("");
        Consola.informacion(
            `Saldo actual: ${Formato.dinero(cuenta.obtenerSaldo())}`
        );
    }
}