// Presentation/Console/Menus/MainMenu.ts
import * as readline from "readline";
import { operacionesBancariasService } from "../../../Application/services/OperacionesBancariasService";
import { Consola } from "../../../shared/utils/Consola";
import { LoginMenu, SesionAutenticada } from "./Autenticacion/LoginMenu";
import { DepositoMenu } from "./Operaciones/DepositoMenu";
import { RetiroMenu } from "./Operaciones/RetiroMenu";
import { HistorialMenu } from "./Operaciones/HistorialMenu";
import { TransferenciaMenu } from "./Operaciones/Transferencia/TransferenciaMenu";
import { CabeceraMenu } from "./Common/CabeceraMenu";
import { OpcionesMenu } from "./Common/OpcionesMenu";

export class MainMenu {

    private sesion: SesionAutenticada | null = null;

    constructor(
        private consola: readline.Interface
    ) {}

    public iniciar(): void {

        const loginMenu = new LoginMenu(
            this.consola
        );

        loginMenu.iniciar(
            (sesionAutenticada: SesionAutenticada) => {

                this.sesion = sesionAutenticada;

                this.mostrarMenu();

            }
        );

    }

    private mostrarMenu(): void {

        if (!this.sesion) {

            return;

        }

        Consola.limpiar();

        CabeceraMenu.mostrar(
            this.sesion
        );

        const opcionesMenu = new OpcionesMenu(
            this.consola
        );

        opcionesMenu.mostrar(
            (opcionSeleccionada: string) => {

                this.ejecutarOpcion(
                    opcionSeleccionada.trim()
                );

            }
        );

    }

    private async ejecutarOpcion(
        opcionSeleccionada: string
    ): Promise<void> {

        if (!this.sesion) {

            return;

        }

        const numeroTarjeta = this.sesion.numeroTarjeta;

        switch (opcionSeleccionada) {

            case "1":

                Consola.limpiar();

                const resultado = await operacionesBancariasService.obtenerSaldo(
                    numeroTarjeta
                );

                if (resultado.status === 200) {
                    const body = resultado.body as { saldo: number };
                    Consola.informacion(`Saldo actual: $${body.saldo}`);
                } else {
                    Consola.error((resultado.body as { error: string }).error);
                }

                this.continuar();

                break;

            case "2":

                new DepositoMenu(
                    numeroTarjeta,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "3":

                new RetiroMenu(
                    numeroTarjeta,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "4":

                new HistorialMenu(
                    numeroTarjeta,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "5":

                new TransferenciaMenu(
                    numeroTarjeta,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "6":

                this.cerrarAplicacion();

                break;

            default:

                Consola.error(
                    "Opción inválida."
                );

                this.continuar();

                break;

        }

    }

    private continuar(): void {

        this.consola.question(
            "\nPresione ENTER para continuar...",
            () => this.mostrarMenu()
        );

    }

    private cerrarAplicacion(): void {

        Consola.limpiar();

        Consola.informacion(
            "Gracias por utilizar el cajero."
        );

        this.consola.close();

    }

}