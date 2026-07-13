// Entities/Transaccion.ts
import { TipoTransaccion, EstadoTransaccion } from "../Enums/TiposDominio";
import { Dinero } from "../Value-Objects/Dinero";
import { OperacionNoSoportadaError } from "../../Shared/Errors";

export class Transaccion {

    private constructor(
        private readonly id: number | undefined,
        private readonly tipo: TipoTransaccion,
        private readonly monto: Dinero,
        private readonly fecha: Date,
        private readonly estado: EstadoTransaccion,
        private readonly descripcion: string | undefined,
        private readonly idCajero: number | undefined,
    ) {}

    static crear(datos: {
        tipo: TipoTransaccion;
        monto: Dinero;
        estado: EstadoTransaccion;
        descripcion?: string;
        idCajero?: number;
    }): Transaccion {

        if (datos.tipo === 'TRANSFERENCIAINTERBANCARIA') {
            throw new OperacionNoSoportadaError('Las transferencias interbancarias aún no están soportadas');
        }
        return new Transaccion(
            undefined,
            datos.tipo,
            datos.monto,
            new Date(),
            datos.estado,
            datos.descripcion,
            datos.idCajero,
        );
    }

    static reconstruir(datos: {
        id: number;
        tipo: TipoTransaccion;
        monto: Dinero;
        fecha: Date;
        estado: EstadoTransaccion;
        descripcion?: string;
        idCajero?: number;
    }): Transaccion {
        return new Transaccion(
            datos.id,
            datos.tipo,
            datos.monto,
            datos.fecha,
            datos.estado,
            datos.descripcion,
            datos.idCajero,
        );
    }

    esExitosa(): boolean {
        return this.estado === 'EXITOSA';
    }

    esFallida(): boolean {
        return this.estado === 'FALLIDA';
    }

    obtenerId(): number | undefined {
        return this.id;
    }

    obtenerTipo(): TipoTransaccion {
        return this.tipo;
    }

    obtenerMonto(): Dinero {
        return this.monto;
    }

    obtenerEstado(): EstadoTransaccion {
        return this.estado;
    }

    obtenerDescripcion(): string | undefined {
        return this.descripcion;
    }

    obtenerIdCajero(): number | undefined {
        return this.idCajero;
    }
}