import { Cuenta } from "./Cuenta";

export class Usuario {
    constructor(
        private numeroTarjeta: string,
        private pin: string,
        private cuenta: Cuenta,
        private nombre: string = "Cliente Fuego"
    ) {}

    public obtenerNumeroTarjeta(): string {
        return this.numeroTarjeta;
    }

    public obtenerPin(): string {
        return this.pin;
    }

    public obtenerCuenta(): Cuenta {
        return this.cuenta;
    }

    public obtenerNombre(): string {
        return this.nombre;
    }
}
