import { IRepository } from "../interfaces/IRepository";
import { Usuario } from "../models/Usuario";
import { Cuenta } from "../models/Cuenta";
import { TipoCuenta } from "../enums/TipoCuenta";

export class UsuarioRepository implements IRepository<Usuario> {

    private usuarios: Usuario[];

    constructor() {

        this.usuarios = [

            new Usuario(
                "Cristopher Vera",
                "122333",
                "1234",
                new Cuenta(
                    "100001",
                    TipoCuenta.AHORROS,
                    500
                )
            ),

            new Usuario(
                "Juan Pérez",
                "122334",
                "4321",
                new Cuenta(
                    "100002",
                    TipoCuenta.CORRIENTE,
                    1200
                )
            )

        ];

    }

    public obtenerTodos(): Usuario[] {

        return this.usuarios;

    }

    public obtenerPorNumeroTarjeta(numeroTarjeta: string): Usuario | null {

        const usuario = this.usuarios.find(
            usuario => usuario.obtenerNumeroTarjeta() === numeroTarjeta
        );

        return usuario ?? null;

    }

}