import { Transaccion } from "./Transaccion";
import { TipoTransaccion } from "../enums/TipoTransaccion";
import { TipoCuenta } from "../enums/TipoCuenta";

export class Cuenta {
    private historial: Transaccion[] = [];

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

    public obtenerHistorial(): Transaccion[] {
        return [...this.historial];
    }

    public consultarSaldo(): number {
        this.registrarTransaccion(
            TipoTransaccion.CONSULTA,
            this.saldo,
            "Consulta de saldo"
        );

        return this.saldo;
    }

    public depositar(monto: number): void {
        this.saldo += monto;

        this.registrarTransaccion(
            TipoTransaccion.DEPOSITO,
            monto,
            "Depósito realizado"
        );
    }

    public retirar(monto: number): void {
        if (monto > this.saldo) {
            throw new Error("Saldo insuficiente.");
        }

        this.saldo -= monto;

        this.registrarTransaccion(
            TipoTransaccion.RETIRO,
            monto,
            "Retiro realizado"
        );
    }

    public establecerSaldo(nuevoSaldo: number): void {
        this.saldo = nuevoSaldo;
    }

    private registrarTransaccion(
        tipo: TipoTransaccion,
        monto: number,
        descripcion: string
    ): void {
        const transaccion = new Transaccion(
            tipo,
            monto,
            new Date(),
            descripcion
        );

        this.historial.push(transaccion);
    }
}