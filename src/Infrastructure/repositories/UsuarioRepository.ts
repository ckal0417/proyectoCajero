import { IRepository } from "../../Application/interfaces/IRepository";
import { Usuario } from "../../Application/models/Usuario";
import { Cliente } from "../../Domain/Entities/Cliente";
import { Cuenta } from "../../Domain/Entities/Cuenta";
import { TipoCuenta } from "../../Domain/enums/TipoCuenta";

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
                " http://localhost:3000",
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