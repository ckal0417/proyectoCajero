import { Cuenta } from "../models/Cuenta";

export class CuentaRepository {

    constructor(
        private cuentas: Cuenta[]
    ) {}

    public obtenerTodas(): Cuenta[] {
        return [...this.cuentas];
    }

    public obtenerPorNumero(
        numeroCuenta: string
    ): Cuenta | null {

        const cuentaEncontrada = this.cuentas.find(
            cuenta =>
                cuenta.obtenerNumeroCuenta() === numeroCuenta
        );

        return cuentaEncontrada ?? null;
    }

    public existe(
        numeroCuenta: string
    ): boolean {

        return this.obtenerPorNumero(numeroCuenta) !== null;
    }

    public actualizarSaldo(
        numeroCuenta: string,
        nuevoSaldo: number
    ): boolean {

        const cuentaEncontrada = this.obtenerPorNumero(
            numeroCuenta
        );

        if (!cuentaEncontrada) {
            return false;
        }

        cuentaEncontrada.establecerSaldo(nuevoSaldo);

        return true;
    }
}