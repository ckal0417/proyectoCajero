// Entities/Transaccion.ts
import { TipoTransaccion } from "../enums/TipoTransaccion";
import { EstadoTransaccion } from "../enums/EstadoTransaccion";
import { Dinero } from "../Value-Objects/Dinero";

export class Transaccion {

    private constructor(
        private readonly id: number | undefined,
        private readonly tipo: TipoTransaccion,
        private readonly monto: Dinero,
        private readonly fecha: Date,
        private readonly estado: EstadoTransaccion,
        private readonly descripcion: string | undefined,
        private readonly idCajero: number | undefined,
        private readonly referenciaExterna: string | undefined,
        private readonly idempotencyKey: string | undefined,
        private readonly estadoDetalle: string | undefined,
        private readonly updatedAt: Date,
    ) {}

    static crear(datos: {
        tipo: TipoTransaccion;
        monto: Dinero;
        estado: EstadoTransaccion;
        descripcion?: string;
        idCajero?: number;
        referenciaExterna?: string;
        idempotencyKey?: string;
        estadoDetalle?: string;
        updatedAt?: Date;
    }): Transaccion {
        return new Transaccion(
            undefined,
            datos.tipo,
            datos.monto,
            new Date(),
            datos.estado,
            datos.descripcion,
            datos.idCajero,
            datos.referenciaExterna,
            datos.idempotencyKey,
            datos.estadoDetalle,
            datos.updatedAt ?? new Date(),
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
        referenciaExterna?: string;
        idempotencyKey?: string;
        estadoDetalle?: string;
        updatedAt?: Date;
    }): Transaccion {
        return new Transaccion(
            datos.id,
            datos.tipo,
            datos.monto,
            datos.fecha,
            datos.estado,
            datos.descripcion,
            datos.idCajero,
            datos.referenciaExterna,
            datos.idempotencyKey,
            datos.estadoDetalle,
            datos.updatedAt ?? datos.fecha,
        );
    }

    esExitosa(): boolean {
        return this.estado === EstadoTransaccion.EXITOSA;
    }

    esFallida(): boolean {
        return this.estado === EstadoTransaccion.FALLIDA;
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

    obtenerReferenciaExterna(): string | undefined {
        return this.referenciaExterna;
    }

    obtenerIdempotencyKey(): string | undefined {
        return this.idempotencyKey;
    }

    obtenerEstadoDetalle(): string | undefined {
        return this.estadoDetalle;
    }

    obtenerUpdatedAt(): Date {
        return this.updatedAt;
    }
}