import { ITransaccionRepository } from '../../../Application/Ports/ITransaccionRepository';
import { Transaccion } from '../../../Domain/Entities/Transaccion';
import { Dinero } from '../../../Domain/Value-Objects/Dinero';
import { TipoTransaccion, EstadoTransaccion } from "../../../Domain/enums/TiposDominio";
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
}

export class TransaccionRepositoryPostgres implements ITransaccionRepository {
    private readonly pool = PostgresConnection.obtenerPool();

    async guardar(transaccion: Transaccion): Promise<Transaccion> {
        let tipoDb: string = transaccion.obtenerTipo();
        if (tipoDb === 'TRANSFERENCIAINTERNA' || tipoDb === 'TRANSFERENCIAINTERBANCARIA') {
            tipoDb = 'TRANSFERENCIA';
        }

        const resultado = await this.pool.query<FilaTransaccion>(
            TransaccionQueries.CREAR,
            [
                tipoDb,
                transaccion.obtenerMonto().toNumber(),
                transaccion.obtenerEstado(),
                transaccion.obtenerDescripcion(),
                transaccion.obtenerIdCajero(),
            ],
        );

        const fila = resultado.rows[0]!;
        const datosRebuild = {
            id: fila.id_transaccion,
            tipo: fila.tipo,
            monto: Dinero.desde(parseFloat(fila.monto)),
            fecha: fila.fecha,
            estado: fila.estado,
            ...(fila.descripcion === undefined ? {} : { descripcion: fila.descripcion }),
            ...(fila.id_cajero === undefined ? {} : { idCajero: fila.id_cajero }),
        } as Parameters<typeof Transaccion.reconstruir>[0];

        return Transaccion.reconstruir(datosRebuild);
    }
}
