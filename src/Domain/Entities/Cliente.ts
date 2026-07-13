export class Cliente {
    private static readonly PATRON_CEDULA = /^\d{10}$/;
    
    private constructor(
        private readonly id: number | undefined, // undefined hasta que se persiste
        private readonly cedula: string,
        private nombres: string,
        private apellidos: string,
        private telefono: string | undefined,
        private correo: string | undefined,
        private direccion: string | undefined,
        private readonly fechaRegistro: Date,
        private activo: boolean,
    ) {}
    
    static crear(datos: {
        cedula: string;
        nombres: string;
        apellidos: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
    }): Cliente {
    if (!Cliente.PATRON_CEDULA.test(datos.cedula)) {
        throw new Error('La cédula debe tener exactamente 10 dígitos');
    }   
    if (!datos.nombres.trim() || !datos.apellidos.trim()) {
        throw new Error('Nombres y apellidos son obligatorios');
    }
    
    return new Cliente(
        undefined,
        datos.cedula,
        datos.nombres,
        datos.apellidos,
        datos.telefono,
        datos.correo,
        datos.direccion,
        new Date(),
        true,
    );
    }
    
    static reconstruir(datos: {
        id: number;
        cedula: string;
        nombres: string;
        apellidos: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
        fechaRegistro: Date;
        activo: boolean;
    }): Cliente {
    return new Cliente(
        datos.id,
        datos.cedula,
        datos.nombres,
        datos.apellidos,
        datos.telefono,
        datos.correo,
        datos.direccion,
        datos.fechaRegistro,
        datos.activo,
    );
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
    
    nombreCompleto(): string {
        return `${this.nombres} ${this.apellidos}`;
    }
    
  // Getters de solo lectura hacia afuera del dominio
    obtenerId(): number | undefined {
        return this.id;
    }
    
    obtenerCedula(): string {
        return this.cedula;
    }
}