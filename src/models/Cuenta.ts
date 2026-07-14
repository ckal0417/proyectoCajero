import { TipoCuenta } from "../Domain/enums/TipoCuenta";

export class Cuenta {

    constructor(
        private numeroCuenta: string,
        private tipoCuenta: TipoCuenta,
        private saldo: number
    ) {}

    public obtenerNumeroCuenta(): string {
        return this.numeroCuenta;
    }

    public obtenerTipoCuenta(): TipoCuenta {
        return this.tipoCuenta;
    }

    public obtenerSaldo(): number {
        return this.saldo;
    }

    public consultarSaldo(): number {
        return this.saldo;
    }

    public depositar(monto: number): void {
        this.saldo += monto;
    }

    public retirar(monto: number): void {

        if (monto > this.saldo) {
            throw new Error("Saldo insuficiente.");
        }

        this.saldo -= monto;
    }

    public establecerSaldo(nuevoSaldo: number): void {
        this.saldo = nuevoSaldo;
    }
}