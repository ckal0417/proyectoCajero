import * as readline from "readline";
import { BancoService } from "../../../../Application/services/BancoService";
import { Usuario } from "../../../../Application/models/Usuario";
import { Consola } from "../../../../shared/utils/Consola";

export class LoginMenu {

    constructor(
        private bancoService: BancoService,
        private consola: readline.Interface
    ) {}

    public iniciar(
        callback: (usuario: Usuario) => void
    ): void {

        Consola.limpiar();
        Consola.titulo("CAJERO AUTOMÁTICO");

        this.pedirTarjeta(callback);

    }

    private pedirTarjeta(
        callback: (usuario: Usuario) => void
    ): void {

        this.consola.question(

            "Ingrese el número de la tarjeta: ",

            (numeroTarjeta: string) => {

                const usuario = this.bancoService.buscarPorTarjeta(
                    numeroTarjeta
                );

                if (!usuario) {

                    Consola.error("Tarjeta no encontrada.");

                    return this.reintentar(callback);

                }

                this.pedirPin(
                    usuario,
                    callback
                );

            }

        );

    }

    private pedirPin(
        usuario: Usuario,
        callback: (usuario: Usuario) => void
    ): void {

        this.consola.question(

            "Ingrese su PIN: ",

            (pin: string) => {

                const valido = this.bancoService.validarPin(
                    usuario,
                    pin
                );

                if (!valido) {

                    Consola.error("PIN incorrecto.");

                    return this.reintentar(callback);

                }

                callback(usuario);

            }

        );

    }

    private reintentar(
        callback: (usuario: Usuario) => void
    ): void {

        this.consola.question(

            "\nPresione ENTER para continuar...",

            () => this.iniciar(callback)

        );

    }

}