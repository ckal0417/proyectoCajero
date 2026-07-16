import { TipoTransaccion } from "../../Domain/enums/TipoTransaccion";
import { Formato } from "../../shared/utils/Formato";

export class Transaccion {

    constructor(
        private tipo: TipoTransaccion,
        private monto: number,
        private fecha: Date,
        private descripcion: string
    ) {}

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
        return `[${Formato.fecha(this.fecha)}] ${this.tipo} - ${Formato.dinero(this.monto)} - ${this.descripcion}`;
    }

}
