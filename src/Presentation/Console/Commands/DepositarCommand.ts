import { ICommand } from "../Interfaces/ICommand";
import { Cuenta } from "../../../Domain/Entities/Cuenta";
import { Consola } from "../../../shared/utils/Consola";
import { Formato } from "../../../shared/utils/Formato";
import { MontoValidacion } from "../../../shared/utils/validaciones/MontoValidacion";
import { DepositoService } from "../../../Application/services/comandos/DepositoService";

export class DepositarCommand implements ICommand {

    public nombre = "depositar";

    constructor(
        private depositoService: DepositoService
    ) {}

    public ejecutar(...parametros: unknown[]): void {

        const cuenta = parametros[0] as Cuenta;
        const monto = parametros[1] as number;

        const validacion = MontoValidacion.validar(monto);

        if (!validacion.estado) {
            Consola.error(validacion.error!);
            return;
        }

        const resultado = this.depositoService.ejecutar(
            cuenta.obtenerNumeroCuenta().toString(),
            validacion.valor!
        );

        if (!resultado.estado) {
            Consola.error(resultado.error!);
            return;
        }

        Consola.exito("DepÃ³sito realizado correctamente.");

        Consola.informacion("");

        Consola.informacion(
            `Saldo actual: ${Formato.dinero(cuenta.obtenerSaldo().toNumber())}`
        );

    }

}
