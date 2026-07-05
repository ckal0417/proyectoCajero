import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../interfaces/ICommand";
import { Consola } from "../utils/Consola";

export class CajeroService {
    private comandos: ICommand[] = [];

    constructor(private cuenta: Cuenta) {}

    public registrarComando(comando: ICommand): void {
        this.comandos.push(comando);
    }

    public ejecutar(nombreComando: string, monto?: number): void {
        const comando = this.comandos.find(
            comando => comando.nombre === nombreComando
        );

        if (!comando) {
            Consola.error("El comando no existe.");
            return;
        }

        try {
            comando.ejecutar(this.cuenta, monto);
        } catch (error) {
            Consola.error((error as Error).message);
        }
    }
}