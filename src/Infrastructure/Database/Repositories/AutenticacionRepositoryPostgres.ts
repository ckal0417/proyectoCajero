import { IAutenticacionRepository } from '../../../Application/Ports/IAutenticacionRepository';
import { Autenticacion } from '../../../Domain/Entities/Autenticacion';
import { PostgresConnection } from '../PostgresConnection';
import { AutenticacionQueries } from '../Queries/AutenticacionQuerie';

interface FilaAutenticacion {
    id_autenticacion: number;
    pin: string;
    intentos: number;
    bloqueado: boolean;
    id_tarjeta: number;
}

export class AutenticacionRepositoryPostgres implements IAutenticacionRepository {
    private readonly pool = PostgresConnection.obtenerPool();

    async buscarPorIdTarjeta(idTarjeta: number): Promise<Autenticacion | null> {
        const resultado = await this.pool.query<FilaAutenticacion>(
            AutenticacionQueries.BUSCAR_POR_ID_TARJETA,
            [idTarjeta],
        );

        if (resultado.rowCount === 0) return null;
        return this.aEntidad(resultado.rows[0]!);
    }

    async guardar(autenticacion: Autenticacion): Promise<void> {
        const idTarjeta = autenticacion.obtenerIdTarjeta();
        const intentos = autenticacion.obtenerIntentos();
        const bloqueado = autenticacion.estaBloqueado();
        const pin = autenticacion.obtenerPinHash();
        await this.pool.query(AutenticacionQueries.GUARDAR, [pin, intentos, bloqueado, idTarjeta]);
    }

    private aEntidad(fila: FilaAutenticacion): Autenticacion {
        return Autenticacion.reconstruir({
            id: fila.id_autenticacion,
            pinHash: fila.pin,
            intentos: fila.intentos,
            bloqueado: fila.bloqueado,
            idTarjeta: fila.id_tarjeta,
        });
    }
}
