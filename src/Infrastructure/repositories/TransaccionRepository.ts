import { Transaccion } from "../../Domain/Entities/Transaccion";

export class TransaccionRepository {
    private transacciones: Transaccion[] = [];

    public guardar(transaccion: Transaccion): void {
        this.transacciones.push(transaccion);
    }

    public obtenerTodas(): Transaccion[] {
        return [...this.transacciones];
    }
}