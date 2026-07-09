import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { Formato } from "../utils/Formato";
import { MontoValidacion } from "../utils/validaciones/MontoValidacion";
import { RetirarOperacion } from "../services/operaciones/retiro/RetirarOperacion";

export class RetirarCommand implements ICommand {
    public nombre: string = "retirar";

    constructor(
        private operacion: RetirarOperacion
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

        Consola.exito("Retiro realizado correctamente.");
        Consola.informacion("");
        Consola.informacion(
            `Saldo actual: ${Formato.dinero(cuenta.obtenerSaldo())}`
        );
    }
}