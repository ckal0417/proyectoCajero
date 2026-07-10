import * as readline from "readline";
import { Usuario } from "../models/Usuario";
import { BancoService } from "../services/BancoService";
import { CajeroService } from "../services/CajeroService";
import { SesionFactory } from "../bootstrap/SesionFactory";
import { Consola } from "../utils/Consola";
import { LoginMenu } from "./autenticacion/LoginMenu";
import { DepositoMenu } from "./comandos/DepositoMenu";
import { RetiroMenu } from "./comandos/RetiroMenu";
import { HistorialMenu } from "./comandos/HistorialMenu";
import { TransferenciaMenu } from "./comandos/Transferencia/TransferenciaMenu";
import { CabeceraMenu } from "./common/CabeceraMenu";
import { OpcionesMenu } from "./common/OpcionesMenu";

export class MainMenu {

    private usuario: Usuario | null = null;

    private cajeroService: CajeroService | null = null;

    constructor(
        private bancoService: BancoService,
        private consola: readline.Interface
    ) {}

    public iniciar(): void {

        const loginMenu = new LoginMenu(
            this.bancoService,
            this.consola
        );

        loginMenu.iniciar(
            (usuarioAutenticado: Usuario) => {

                this.usuario = usuarioAutenticado;

                this.prepararSesion();

            }
        );

    }

    private prepararSesion(): void {

        if (!this.usuario) {

            Consola.error(
                "No fue posible preparar la sesión."
            );

            return;

        }

        this.cajeroService = SesionFactory.crear(
            this.usuario,
            this.bancoService
        );

        this.mostrarMenu();

    }

    private mostrarMenu(): void {

        if (!this.usuario || !this.cajeroService) {

            return;

        }

        Consola.limpiar();

        CabeceraMenu.mostrar(
            this.usuario
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

    private ejecutarOpcion(
        opcionSeleccionada: string
    ): void {

        if (!this.usuario || !this.cajeroService) {

            return;

        }

        const cuentaUsuario =
            this.usuario.obtenerCuenta();

        switch (opcionSeleccionada) {

            case "1":

                Consola.limpiar();

                this.cajeroService.ejecutar(
                    "saldo",
                    cuentaUsuario
                );

                this.continuar();

                break;

            case "2":

                new DepositoMenu(
                    cuentaUsuario,
                    this.cajeroService,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "3":

                new RetiroMenu(
                    cuentaUsuario,
                    this.cajeroService,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "4":

                new HistorialMenu(
                    cuentaUsuario,
                    this.cajeroService,
                    this.consola
                ).iniciar(
                    () => this.mostrarMenu()
                );

                break;

            case "5":

                new TransferenciaMenu(
                    cuentaUsuario,
                    this.cajeroService,
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