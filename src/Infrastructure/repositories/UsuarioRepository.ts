import { Usuario } from '../../Application/models/Usuario';

export class UsuarioRepository {
    constructor(private readonly usuarios: Usuario[] = []) {}

    public obtenerTodos(): Usuario[] {
        return [...this.usuarios];
    }

    public obtenerPorNumeroTarjeta(numeroTarjeta: string): Usuario | null {
        return this.usuarios.find((usuario) => usuario.obtenerNumeroTarjeta() === numeroTarjeta) ?? null;
    }

    public guardar(usuario: Usuario): void {
        const indiceExistente = this.usuarios.findIndex(
            (item) => item.obtenerNumeroTarjeta() === usuario.obtenerNumeroTarjeta(),
        );

        if (indiceExistente >= 0) {
            this.usuarios[indiceExistente] = usuario;
            return;
        }

        this.usuarios.push(usuario);
    }
}
