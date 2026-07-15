import { TipoTransaccion } from "../../Domain/enums/TipoTransaccion";

export class Transaccion {
    constructor(
        public readonly tipo: TipoTransaccion,
        public readonly monto: number,
        public readonly fecha: Date,
        public readonly descripcion: string
    ) {}

    public mostrar(): string {
        return `[${this.fecha.toLocaleString()}] ${this.tipo}: $${this.monto.toFixed(2)} - ${this.descripcion}`;
    }
}
