import { ICommand } from "../Interfaces/ICommand";
import { Cuenta } from "../../../Domain/Entities/Cuenta";
import { Consola } from "../../../shared/utils/Consola";
import { Formato} from "../../../shared/utils/Formato";
import { SaldoService } from "../../../Application/services/comandos/SaldoService";
export class ConsultarSaldoCommand implements ICommand {

    public nombre = "saldo";

    constructor(
        private saldoService: SaldoService
    ) {}

    public ejecutar(...parametros: unknown[]): void {

        const cuenta = parametros[0] as Cuenta;

        Consola.titulo("CONSULTAR SALDO");

        const resultado = this.saldoService.ejecutar(
            cuenta.obtenerNumeroCuenta().toString()
        );

        if (!resultado.estado) {
            Consola.error(resultado.error);
            return;
        }

        Consola.informacion(
            `Saldo actual: ${Formato.dinero(resultado.valor)}`
        );

    }

}
