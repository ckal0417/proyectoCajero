import { Transaccion } from "./Transaccion";
import { TipoTransaccion } from "./TipoTransaccion";

export class Cuenta {
    private historial: Transaccion[] = [];

    constructor(
        private numeroCuenta: string,
        private tipoCuenta: string,
        private saldo: number
    ) {}

    public obtenerNumeroCuenta(): string {
        return this.numeroCuenta;
    }

    public obtenerTipoCuenta(): string {
        return this.tipoCuenta;
    }

    public obtenerSaldo(): number {
        return this.saldo;
    }

    public obtenerHistorial(): Transaccion[] {
        return this.historial;
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

    private registrarTransaccion(
        tipo: TipoTransaccion,
        monto: number,
        descripcion: string
    ): void {
        const transaccion = new Transaccion(
            undefined as unknown as number,
            tipo,
            monto,
            new Date(),
            descripcion
        );

        this.historial.push(transaccion);
    }
}