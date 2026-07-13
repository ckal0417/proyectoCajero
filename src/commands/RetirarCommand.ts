import { ICommand } from "../Application/interfaces/ICommand";
import { Cuenta } from "../Application/models/Cuenta";
import { Consola } from "../shared/utils/Consola";
import { Formato } from "../shared/utils/Formato";
import { MontoValidacion } from "../shared/utils/validaciones/MontoValidacion";
import { RetiroService } from "../Application/services/comandos/RetiroService";
export class RetirarCommand implements ICommand {

    public nombre = "retirar";

    constructor(
        private retiroService: RetiroService
    ) {}

    public ejecutar(...parametros: unknown[]): void {

        const cuenta = parametros[0] as Cuenta;
        const monto = parametros[1] as number;

        const validacion = MontoValidacion.validar(monto);

        if (!validacion.estado) {
            Consola.error(validacion.error);
            return;
        }

        const resultado = this.retiroService.ejecutar(
            cuenta.obtenerNumeroCuenta(),
            validacion.valor
        );

        if (!resultado.estado) {
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