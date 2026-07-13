// Entities/Movimiento.ts
import { TipoMovimiento } from "../Enums/TiposDominio";
import { Dinero } from "../Value-Objects/Dinero";

export class Movimiento {
    private constructor(
        private readonly id: number | undefined,
        private readonly tipo: TipoMovimiento,
        private readonly monto: Dinero,
        private readonly saldoAnterior: Dinero,
        private readonly saldoNuevo: Dinero,
        private readonly fecha: Date,
        private readonly idCuenta: number,
        private readonly idTransaccion: number,
    ) {}

    static crear(datos: {
        tipo: TipoMovimiento;
        monto: Dinero;
        saldoAnterior: Dinero;
        saldoNuevo: Dinero;
        idCuenta: number;
        idTransaccion: number;
    }): 
    Movimiento {
        Movimiento.validarConsistencia(datos.monto, datos.saldoAnterior, datos.saldoNuevo);
        
        return new Movimiento(
            undefined, 
            datos.tipo,
            datos.monto,
            datos.saldoAnterior,
            datos.saldoNuevo,
            new Date(),
            datos.idCuenta,
            datos.idTransaccion,
        );
    }

    static reconstruir(datos: {
        id: number;
        tipo: TipoMovimiento;
        monto: Dinero;
        saldoAnterior: Dinero;
        saldoNuevo: Dinero;
        fecha: Date;
        idCuenta: number;
        idTransaccion: number;
    }): Movimiento {
        return new Movimiento(
            datos.id,
            datos.tipo,
            datos.monto,
            datos.saldoAnterior,
            datos.saldoNuevo,
            datos.fecha,
            datos.idCuenta,
            datos.idTransaccion,
        );
    }

    private static validarConsistencia(monto: Dinero, saldoAnterior: Dinero, saldoNuevo: Dinero): void {
        if (saldoAnterior.equals(saldoNuevo)) {
            return; // intento sin efecto en el saldo (ej. transacción fallida)
        }
        const diferencia = saldoNuevo.esMayorQue(saldoAnterior)
            ? saldoNuevo.restar(saldoAnterior)
            : saldoAnterior.restar(saldoNuevo);
        if (!diferencia.equals(monto)) {
        throw new Error('La diferencia de saldo no coincide con el monto del movimiento');
    }
    }

    esDebito(): boolean {
        return this.saldoNuevo.esMenorQue(this.saldoAnterior);
    }

    esCredito(): boolean {
        return this.saldoNuevo.esMayorQue(this.saldoAnterior);
    }

    obtenerId(): number | undefined {
        return this.id;
    }

    obtenerTipo(): TipoMovimiento {
        return this.tipo;
    }

    obtenerMonto(): Dinero {
        return this.monto;
    }

    obtenerSaldoAnterior(): Dinero {
        return this.saldoAnterior;
    }

    obtenerSaldoNuevo(): Dinero {
        return this.saldoNuevo;
    }

    obtenerIdCuenta(): number {
        return this.idCuenta;
    }

    obtenerIdTransaccion(): number {
        return this.idTransaccion;
    }
}