import { ITransaccionRepository } from '../../../Application/Ports/ITransaccionRepository';
import { Transaccion } from '../../../Domain/Entities/Transaccion';
import { Dinero } from '../../../Domain/Value-Objects/Dinero';
import { TipoTransaccion } from '../../../Domain/enums/TipoTransaccion';
import { EstadoTransaccion } from '../../../Domain/enums/EstadoTransaccion';
import { PostgresConnection } from '../PostgresConnection';
import { TransaccionQueries } from '../Queries/TransaccionQuerie';

interface FilaTransaccion {
    id_transaccion: number;
    tipo: TipoTransaccion;
    monto: string;
    fecha: Date;
    estado: EstadoTransaccion;
    descripcion?: string;
    id_cajero?: number;
    referencia_externa?: string;
    idempotency_key?: string;
    estado_detalle?: string;
    updated_at?: Date;
}

export class TransaccionRepositoryPostgres implements ITransaccionRepository {
    private readonly pool = PostgresConnection.obtenerPool();

    async guardar(transaccion: Transaccion): Promise<Transaccion> {
        const resultado = await this.pool.query<FilaTransaccion>(
            TransaccionQueries.CREAR,
            [
                transaccion.obtenerTipo(),
                transaccion.obtenerMonto().toNumber(),
                transaccion.obtenerEstado(),
                transaccion.obtenerDescripcion(),
                transaccion.obtenerIdCajero(),
                transaccion.obtenerReferenciaExterna(),
                transaccion.obtenerIdempotencyKey(),
                transaccion.obtenerEstadoDetalle(),
                transaccion.obtenerUpdatedAt(),
            ],
        );

        function omitirUndefined<T extends object>(obj: T): T {
            return Object.fromEntries(
                Object.entries(obj).filter(([, v]) => v !== undefined)
            ) as T;
        }

        const fila = resultado.rows[0]!;

        const datosRebuild = omitirUndefined({
            id: fila.id_transaccion,
            tipo: fila.tipo,
            monto: Dinero.desde(parseFloat(fila.monto)),
            fecha: fila.fecha,
            estado: fila.estado,
            descripcion: fila.descripcion,
            idCajero: fila.id_cajero,
            referenciaExterna: fila.referencia_externa,
            idempotencyKey: fila.idempotency_key,
            estadoDetalle: fila.estado_detalle,
            updatedAt: fila.updated_at,
        }) as Parameters<typeof Transaccion.reconstruir>[0];

        return Transaccion.reconstruir(datosRebuild);
    }
}
