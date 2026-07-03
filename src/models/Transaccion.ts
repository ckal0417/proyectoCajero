import { TipoTransaccion } from "./TipoTransaccion";

export class Transaccion {

    // Contador para generar un ID automático
    private static contador: number = 1;

    // Identificador de la transacción
    private id: number;

    // Tipo de operación
    private tipo: TipoTransaccion;

    // Cantidad de dinero
    private monto: number;

    // Información adicional
    private descripcion: string;

    // Fecha de la operación
    private fecha: Date;

    constructor(
        tipo: TipoTransaccion,
        monto: number,
        fecha: Date,
        descripcion: string = ""
    ) {

        this.id = Transaccion.contador++;

        this.tipo = tipo;

        this.monto = monto;

        this.fecha = fecha;

        this.descripcion = descripcion;

    }

    // =============================
    // GETTERS
    // =============================

    public obtenerId(): number {

        return this.id;

    }

    public obtenerTipo(): TipoTransaccion {

        return this.tipo;

    }

    public obtenerMonto(): number {

        return this.monto;

    }

    public obtenerDescripcion(): string {

        return this.descripcion;

    }

    public obtenerFecha(): Date {

        return this.fecha;

    }

    // =============================
    // Mostrar la transacción
    // =============================

    public mostrar(): string {

        return `
----------------------------------------
ID: ${this.id}

Tipo: ${this.tipo}

Monto: $${this.monto}

Fecha: ${this.fecha.toLocaleString()}
----------------------------------------`;

    }

}