import { TipoTransaccion } from "../../Domain/enums/TipoTransaccion";
import { Formato } from "../../shared/utils/Formato";

export interface TransaccionData {
    tipo: TipoTransaccion;
    monto: number;
    estado?: string;
    descripcion?: string;
    idCajero?: number;
}

export class Transaccion {
    private static contador: number = 1;
    private id: number;

    constructor(
        private tipo: TipoTransaccion,
        private monto: number,
        private fecha: Date,
        private descripcion: string,
        private estado?: string,
        private idCajero?: number
    ) {
        this.id = Transaccion.contador++;
    }

    static crear(datos: TransaccionData): Transaccion {
        return new Transaccion(
            datos.tipo,
            datos.monto,
            new Date(),
            datos.descripcion || '',
            datos.estado,
            datos.idCajero
        );
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

    public obtenerId(): number {
        return this.id;
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