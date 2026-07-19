import { Transaccion } from "../../../Domain/Entities/Transaccion";


type TransaccionCompat = Transaccion;

export class TransaccionRepository {
    private readonly transacciones: TransaccionCompat[] = [];

    public guardar(transaccion: TransaccionCompat): void {
        this.transacciones.push(transaccion);
    }

    public obtenerTodas(): TransaccionCompat[] {
        return [...this.transacciones];
    }
}
