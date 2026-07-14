import { Transaccion as TransaccionApp } from '../../Application/models/Transaccion';
import { Transaccion as TransaccionDomain } from '../../Domain/Entities/Transaccion';

type TransaccionCompat = TransaccionApp | TransaccionDomain;

export class TransaccionRepository {
    private readonly transacciones: TransaccionCompat[] = [];

    public guardar(transaccion: TransaccionCompat): void {
        this.transacciones.push(transaccion);
    }

    public obtenerTodas(): TransaccionCompat[] {
        return [...this.transacciones];
    }
}
