// Presentation/Console/Menus/Autenticacion/LoginMenu.ts
import * as readline from "readline";
import { NumeroCuenta } from "../../../../Domain/Value-Objects/NumeroCuenta";
import { Consola } from "../../../../shared/utils/Consola";
import { autenticacionService } from "../../../../Application/services/AutenticationService";

export interface SesionAutenticada {
    numeroTarjeta: string;
    numeroCuenta: string | NumeroCuenta;
    saldo: number;
}

export class LoginMenu {

    constructor(
        private consola: readline.Interface
    ) {}

    public iniciar(
        onLoginExitoso: (sesion: SesionAutenticada) => void
    ): void {

        this.pedirTarjeta(onLoginExitoso);

    }

    private pedirTarjeta(
        onLoginExitoso: (sesion: SesionAutenticada) => void
    ): void {

        Consola.limpiar();

        this.consola.question(
            "Número de tarjeta: ",
            (numeroTarjeta: string) => {

                this.pedirPin(
                    numeroTarjeta.trim(),
                    onLoginExitoso
                );

            }
        );

    }

    private pedirPin(
        numeroTarjeta: string,
        onLoginExitoso: (sesion: SesionAutenticada) => void
    ): void {

        this.consola.question(
            "PIN: ",
            async (pin: string) => {

                await this.autenticar(
                    numeroTarjeta,
                    pin.trim(),
                    onLoginExitoso
                );

            }
        );

    }

    private async autenticar(
        numeroTarjeta: string,
        pin: string,
        onLoginExitoso: (sesion: SesionAutenticada) => void
    ): Promise<void> {

        const resultado = await autenticacionService.autenticar(
            numeroTarjeta,
            pin
        );

        if (!resultado.exito) {

            Consola.error(resultado.error);

            this.consola.question(
                "\nPresione ENTER para reintentar...",
                () => this.pedirTarjeta(onLoginExitoso)
            );

            return;

        }

        onLoginExitoso({
            numeroTarjeta: resultado.numeroTarjeta,
            numeroCuenta: resultado.numeroCuenta,
            saldo: resultado.saldo
        });

    }

}