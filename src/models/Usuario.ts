import { Cuenta } from "./Cuenta";

export class Usuario {

    constructor(

        private nombre: string,
        private numeroTarjeta: string,
        private pin: string,
        private cuenta: Cuenta

    ) {}

    public obtenerNombre(): string {

        return this.nombre;

    }

    public obtenerNumeroTarjeta(): string {

        return this.numeroTarjeta;

    }

    public obtenerPin(): string {

        return this.pin;

    }

    public obtenerCuenta(): Cuenta {

        return this.cuenta;

    }

}