import { Cuenta } from "../models/Cuenta";

export class CuentaRepository {

    constructor(
        private cuentas: Cuenta[]
    ) {}

    public obtenerPorNumero(numeroCuenta: string): Cuenta | null {

        const cuenta = this.cuentas.find(

            cuenta => cuenta.obtenerNumeroCuenta() === numeroCuenta

        );

        return cuenta ?? null;

    }

    public actualizarSaldo(

        numeroCuenta: string,

        nuevoSaldo: number

    ): void {

        const cuenta = this.obtenerPorNumero(numeroCuenta);

        if (!cuenta) {

            return;

        }

        cuenta.establecerSaldo(nuevoSaldo);

    }

}