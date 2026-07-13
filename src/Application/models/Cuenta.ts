import { Transaccion } from "./Transaccion";
import { TipoTransaccion } from "../../Domain/enums/TipoTransaccion";
import { TipoCuenta } from "../../Domain/enums/TipoCuenta";

export class Cuenta {
    private historial: Transaccion[] = [];

    constructor(
        private id: number | undefined,
        private numeroCuenta: string,
        private tipoCuenta: TipoCuenta,
        private saldo: number
    ) {}

    public obtenerNumeroCuenta(): string {
        return this.numeroCuenta;
    }

    public obtenerId(): number | undefined {
        return this.id;
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

    public retirar(monto: number): { saldoAnterior: number; saldoNuevo: number } {
        if (monto > this.saldo) {
            throw new Error("Saldo insuficiente.");
        }

        const saldoAnterior = this.saldo;
        this.saldo -= monto;
        const saldoNuevo = this.saldo;

        this.registrarTransaccion(
            TipoTransaccion.RETIRO,
            monto,
            "Retiro realizado"
        );

        return { saldoAnterior, saldoNuevo };
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