import { ITarjetaRepository } from '../../../Application/Ports/ITarjetaRepository';
import { Tarjeta } from '../../../Domain/Entities/Tarjeta';
import { NumeroTarjeta } from '../../../Domain/Value-Objects/NumeroTarjeta';
import { TipoTarjeta } from "../../../Domain/enums/TiposDominio";
import { PostgresConnection } from '../PostgresConnection';
import { TarjetaQueries } from '../Queries/TarjetaQuerie';

interface FilaTarjeta {
    id_tarjeta: number;
    numero_tarjeta: string;
    tipo: TipoTarjeta;
    fecha_vencimiento: Date;
    cvv: string;
    activa: boolean;
    id_cuenta: number;
}

export class TarjetaRepositoryPostgres implements ITarjetaRepository {
    private readonly pool = PostgresConnection.obtenerPool();

    async buscarPorNumero(numero: NumeroTarjeta): Promise<Tarjeta | null> {
        const resultado = await this.pool.query<FilaTarjeta>(
            TarjetaQueries.BUSCAR_POR_NUMERO,
            [numero.valorCompleto()],
        );

        if (resultado.rowCount === 0) return null;
        return this.aEntidad(resultado.rows[0]!);
    }

    private aEntidad(fila: FilaTarjeta): Tarjeta {
        return Tarjeta.reconstruir({
            id: fila.id_tarjeta,
            numeroTarjeta: NumeroTarjeta.desde(fila.numero_tarjeta),
            tipo: fila.tipo,
            fechaVencimiento: fila.fecha_vencimiento,
            cvv: fila.cvv,
            activa: fila.activa,
            idCuenta: fila.id_cuenta,
        });
    }
}
