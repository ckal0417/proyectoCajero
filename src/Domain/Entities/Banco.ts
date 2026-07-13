// Entities/Banco.ts
export class Banco {
    private constructor(
        private readonly id: number | undefined,
        private nombre: string,
        private readonly codigo: string,
        private direccion: string | undefined,
        private activo: boolean,
    ) {}

    static crear(datos: {
        nombre: string;
        codigo: string;
        direccion?: string;
    }): Banco {
        if (!datos.nombre.trim()) {
            throw new Error('El nombre del banco es obligatorio');
        }
        if (!/^[A-Z0-9]{2,20}$/.test(datos.codigo)) {
            throw new Error('El código del banco debe ser alfanumérico en mayúsculas (2-20 caracteres)');
        }
        return new Banco(undefined, datos.nombre, datos.codigo, datos.direccion, true);
    }

    static reconstruir(datos: {
        id: number;
        nombre: string;
        codigo: string;
        direccion?: string;
        activo: boolean;
    }): Banco {
        return new Banco(datos.id, datos.nombre, datos.codigo, datos.direccion, datos.activo);
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

    obtenerCodigo(): string {
        return this.codigo;
    }
}