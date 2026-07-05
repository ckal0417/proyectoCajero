import { Usuario } from "../models/Usuario";
import { Cuenta } from "../models/Cuenta";

export class BancoService {

    // Memoria del banco
    private usuarios: Usuario[];

    constructor() {

        this.usuarios = [

            new Usuario(
                "Cristopher Vera",
                "122333",
                "1234",
                new Cuenta(
                    "100001",
                    "Ahorros",
                    500
                )
            ),

            new Usuario(
                "Juan Pérez",
                "4587000000000001",
                "4321",
                new Cuenta(
                    "100002",
                    "Corriente",
                    1200
                )
            )

        ];

    }

    // Buscar usuario por número de tarjeta
    public buscarPorTarjeta(numeroTarjeta: string): Usuario | null {

        const usuario = this.usuarios.find(

            usuario => usuario.obtenerNumeroTarjeta() === numeroTarjeta

        );

        return usuario ?? null;

    }

    // Validar PIN
    public validarPin(
        usuario: Usuario,
        pin: string
    ): boolean {

        return usuario.obtenerPin() === pin;

    }

}