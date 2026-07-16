import { Cuenta } from "../../../Application/models/Cuenta";


export class CuentaRepository {
    constructor(private readonly cuentas: Cuenta[] = []) {}

    public obtenerPorNumero(numeroCuenta: string): Cuenta | null {
        return this.cuentas.find((cuenta) => cuenta.obtenerNumeroCuenta() === numeroCuenta) ?? null;
    }

    public actualizarSaldo(numeroCuenta: string, nuevoSaldo: number): void {
        const cuenta = this.obtenerPorNumero(numeroCuenta);

        if (!cuenta) {
            return;
        }

        cuenta.establecerSaldo(nuevoSaldo);
    }

    public obtenerTodas(): Cuenta[] {
        return [...this.cuentas];
    }
}
