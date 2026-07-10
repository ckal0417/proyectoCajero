import { ICommand } from "../interfaces/ICommand";
import { Cuenta } from "../models/Cuenta";
import { Consola } from "../utils/Consola";
import { Formato } from "../utils/Formato";
import { MontoValidacion } from "../utils/validaciones/MontoValidacion";
import { DepositoService } from "../services/operaciones/deposito/DepositoService";

export class DepositarCommand implements ICommand {

    public nombre = "depositar";

    constructor(
        private depositoService: DepositoService
    ) {}

    public ejecutar(...parametros: unknown[]): void {

        const cuenta = parametros[0] as Cuenta;
        const monto = parametros[1] as number;

        const validacion = MontoValidacion.validar(monto);

        if (!validacion.exitoso) {
            Consola.error(validacion.error);
            return;
        }

        const resultado = this.depositoService.ejecutar(
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