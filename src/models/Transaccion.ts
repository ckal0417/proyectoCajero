import { TipoTransaccion } from "../enums/TipoTransaccion";
import { Formato } from "../utils/Formato";

export class Transaccion {
    private static contador: number = 1;
    private id: number;

    constructor(
        private tipo: TipoTransaccion,
        private monto: number,
        private fecha: Date,
        private descripcion: string
    ) {
        this.id = Transaccion.contador++;
    }

    public obtenerTipo(): TipoTransaccion {
        return this.tipo;
    }

    public obtenerMonto(): number {
        return this.monto;
    }

    public obtenerFecha(): Date {
        return this.fecha;
    }

    public obtenerDescripcion(): string {
        return this.descripcion;
    }

    public mostrar(): string {
        return `
-----------------------------------
ID: ${this.id}
Tipo: ${this.tipo}
Monto: ${Formato.dinero(this.monto)}
Fecha: ${Formato.fecha(this.fecha)}
Descripción: ${this.descripcion}
-----------------------------------`;
    }
}