import { IMovimientoRepository } from '../../../Application/Ports/IMovimientoRepository';
import { Movimiento } from '../../../Domain/Entities/Movimiento';
import { PostgresConnection } from '../PostgresConnection';
import { MovimientoQueries } from '../Queries/MovimientoQuerie';

export class MovimientoRepositoryPostgres implements IMovimientoRepository {
    private readonly pool = PostgresConnection.obtenerPool();

    async guardar(movimiento: Movimiento): Promise<void> {
        await this.pool.query(MovimientoQueries.CREAR, [
            movimiento.obtenerTipo(),
            movimiento.obtenerMonto().toNumber(),
            movimiento.obtenerSaldoAnterior().toNumber(),
            movimiento.obtenerSaldoNuevo().toNumber(),
            movimiento.obtenerIdCuenta(),
            movimiento.obtenerIdTransaccion(),
        ]);
    }
}
