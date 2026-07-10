import { Usuario } from "../../models/Usuario";
import { UsuarioRepository } from "../../repositories/UsuarioRepository";
export class BancoService {

    constructor(
        private usuarioRepository: UsuarioRepository
    ) {}

    public buscarPorTarjeta(numeroTarjeta: string): Usuario | null {

        return this.usuarioRepository.obtenerPorNumeroTarjeta(
            numeroTarjeta
        );

    }

    public validarPin(
        usuario: Usuario,
        pin: string
    ): boolean {

        return usuario.obtenerPin() === pin;

    }

    public autenticar(
        numeroTarjeta: string,
        pin: string
    ): Usuario | null {

        const usuario = this.buscarPorTarjeta(numeroTarjeta);

        if (!usuario) {

            return null;

        }

        if (!this.validarPin(usuario, pin)) {

            return null;

        }

        return usuario;

    }

}