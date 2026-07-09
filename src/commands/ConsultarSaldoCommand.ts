import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";
import { Formato } from "../utils/Formato";
import { ConsultarSaldoOperacion } from "../services/operaciones/saldo/ConsultarSaldoOperacion";

export class ConsultarSaldoCommand implements ICommand {
    public nombre: string = "saldo";

    constructor(
        private operacion: ConsultarSaldoOperacion
    ) {}

    public ejecutar(cuenta: Cuenta): void {
        Consola.titulo("CONSULTAR SALDO");

        const resultado = this.operacion.ejecutar(
            cuenta.obtenerNumeroCuenta()
        );

        if (!resultado.exitoso) {
            Consola.error(resultado.error);
            return;
        }

        Consola.informacion(`Cuenta: ${cuenta.obtenerNumeroCuenta()}`);
        Consola.informacion(
            `Saldo actual: ${Formato.dinero(resultado.valor)}`
        );
    }
}