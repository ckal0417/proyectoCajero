import * as readline from "readline";
import { Usuario } from "../../Application/models/Usuario";
import { BancoService } from "../../Application/services/BancoService";
import { CajeroService } from "../../Application/services/CajeroService";
import { SesionFactory } from "../../Application/bootstrap/SesionFactory";
import { Consola } from "../../shared/utils/Consola";
import { LoginMenu } from "./Autenticacion/LoginMenu";
import { DepositoMenu } from "./comandos/DepositoMenu";
import { RetiroMenu } from "./comandos/RetiroMenu";
import { HistorialMenu } from "./comandos/HistorialMenu";
import { TransferenciaMenu } from "./comandos/Transferencia/TransferenciaMenu";
import { CabeceraMenu } from "./Common/CabeceraMenu";
import { OpcionesMenu } from "./Common/OpcionesMenu";

export class MainMenu {

    private usuario: Usuario | null = null;

    private cajeroService: CajeroService | null = null;
// Recibe dos cosas inyectadas de dependencias ,Main menu no crea
// sus propias dependencias, las recibe ya armadas.
    constructor(
        private bancoService: BancoService,
        private consola: readline.Interface
    ) {}
// Crea el loginMenu y le pasa un callback
//Cuando el loginMenu  sea exitoso, ese callback guarda el usuario autenticado y llama a prepararSesion
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
// Aqui usa sesionFactory.crear para construir el cajeroService de ese usuario.
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
// Limpia consola ,muestra la cabecera y crea un opcionesMenu que le pide al 
//usuario que elija una opcion "1,2,3"  y llama a ejecutarOpcion con la opcion elegida.
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