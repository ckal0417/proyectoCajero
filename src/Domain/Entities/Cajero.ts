// Entities/Cajero.ts
export class Cajero {
    private constructor(
        private readonly id: number | undefined,
        private readonly codigo: string,
        private ubicacion: string | undefined,
        private activo: boolean,
        private readonly idBanco: number,
    ) {}

    static crear(datos: {
        codigo: string;
        ubicacion?: string;
        idBanco: number;
    }): Cajero {
        if (!/^[A-Z0-9]{2,20}$/.test(datos.codigo)) {
        throw new Error('El código del cajero debe ser alfanumérico en mayúsculas (2-20 caracteres)');
        }
        return new Cajero(undefined, datos.codigo, datos.ubicacion, true, datos.idBanco);
    }

    static reconstruir(datos: {
        id: number;
        codigo: string;
        ubicacion?: string;
        activo: boolean;
        idBanco: number;
    }): Cajero {
        return new Cajero(datos.id, datos.codigo, datos.ubicacion, datos.activo, datos.idBanco);
    }

    //Metodo para saber si el cajero esta activo
    asegurarOperativo(): void {
        if (!this.activo) {
        throw new Error(`El cajero ${this.codigo} está fuera de servicio`);
        }
    }

    desactivar(): void {
        this.activo = false;
    }

    activar(): void {
        this.activo = true;
    }

    estaActivo(): boolean {
        return this.activo;
    }

    obtenerId(): number | undefined {
        return this.id;
    }

    obtenerIdBanco(): number {
        return this.idBanco;
    }
}