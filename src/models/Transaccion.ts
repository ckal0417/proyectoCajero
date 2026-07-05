import { TipoTransaccion } from "./TipoTransaccion";
import { Formato } from "../utils/Formato";

export class Transaccion {
    private static contador: number = 1;

    constructor(
        private id: number = Transaccion.contador++,
        private tipo: TipoTransaccion,
        private monto: number,
        private fecha: Date,
        private descripcion: string
    ) {}

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