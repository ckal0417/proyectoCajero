import { Transaccion } from "./Transaccion";
import { TipoTransaccion } from "./TipoTransaccion";

export class Cuenta {

    // Datos del propietario de la cuenta
    private titular: string;

    // Número de cuenta
    private numeroCuenta: string;

    // Saldo disponible
    private saldo: number;

    // Historial de movimientos
    private historial: Transaccion[];

    constructor(
        titular: string,
        saldoInicial: number
    ) {

        this.titular = titular;

        // Por ahora el número será fijo.
        // Más adelante podremos generarlo automáticamente.
        this.numeroCuenta = "100001";

        this.saldo = saldoInicial;

        this.historial = [];

    }

    // =============================
    // GETTERS
    // =============================

    public obtenerTitular(): string {

        return this.titular;

    }

    public obtenerNumeroCuenta(): string {

        return this.numeroCuenta;

    }

    public consultarSaldo(): number {

        return this.saldo;

    }

    public obtenerHistorial(): Transaccion[] {

        return this.historial;

    }

    // =============================
    // OPERACIONES
    // =============================

    public depositar(monto: number): void {

        if (monto <= 0) {

            throw new Error("El monto debe ser mayor que cero.");

        }

        this.saldo += monto;

        this.historial.push(

            new Transaccion(
                TipoTransaccion.DEPOSITO,
                monto,
                new Date(),
                "Depósito realizado"
            )

        );

    }

    public retirar(monto: number): void {

        if (monto <= 0) {

            throw new Error("El monto debe ser mayor que cero.");

        }

        if (monto > this.saldo) {

            throw new Error("Saldo insuficiente.");

        }

        this.saldo -= monto;

        this.historial.push(

            new Transaccion(
                TipoTransaccion.RETIRO,
                monto,
                new Date(),
                "Retiro realizado"
            )

        );

    }

}