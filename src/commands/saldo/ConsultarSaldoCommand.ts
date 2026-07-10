import { ICommand } from "../../interfaces/ICommand";
import { Cuenta } from "../../models/Cuenta";
import { Consola } from "../../utils/Consola";
import { Formato } from "../../utils/Formato";
import { SaldoService } from "../../services/operaciones/saldo/SaldoService"

export class ConsultarSaldoCommand implements ICommand {

    public nombre = "saldo";

    constructor(
        private saldoService: SaldoService
    ) {}

    public ejecutar(...parametros: unknown[]): void {

        const cuenta = parametros[0] as Cuenta;

        Consola.titulo("CONSULTAR SALDO");

        const resultado = this.saldoService.ejecutar(
            cuenta.obtenerNumeroCuenta()
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