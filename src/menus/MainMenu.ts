import * as readline from "readline";
import { BancoService } from "../services/BancoService";
import { CajeroService } from "../services/CajeroService";
import { Usuario } from "../models/Usuario";
import { Consola } from "../utils/Consola";
import { Formato } from "../utils/Formato";
import { ConsultarSaldoCommand } from "../commands/ConsultarSaldoCommand";
import { DepositarCommand } from "../commands/DepositarCommand";
import { RetirarCommand } from "../commands/RetirarCommand";
import { HistorialCommand } from "../commands/HistorialCommand";

export class MainMenu {

    private usuario: Usuario | null = null;
    private cajeroService: CajeroService | null = null;
    constructor(

        private bancoService: BancoService,
        private consola: readline.Interface

    ) {}

    public iniciar(): void {

        Consola.limpiar();
        Consola.titulo("CAJERO AUTOMÁTICO");
        this.pedirTarjeta();

    }

    private pedirTarjeta(): void {

        this.consola.question(

            "Ingrese el número de la tarjeta: ",

            (numeroTarjeta: string) => {

                const usuario = this.bancoService.buscarPorTarjeta(

                    numeroTarjeta

                );

                if (!usuario) {

                    Consola.error("Tarjeta no encontrada.");
                    return this.continuarInicio();

                }

                this.usuario = usuario;
                this.pedirPin();

            }

        );

    }

    private pedirPin(): void {

        this.consola.question(

            "Ingrese su PIN: ",

            (pin: string) => {

                if (

                    !this.usuario ||

                    !this.bancoService.validarPin(

                        this.usuario,pin

                    )

                ) {

                    Consola.error("PIN incorrecto.");
                    return this.continuarInicio();

                }

                this.prepararSesion();

            }

        );

    }

    private prepararSesion(): void {

        if (!this.usuario) {

            return;

        }

        this.cajeroService = new CajeroService(

            this.usuario.obtenerCuenta()

        );

        this.cajeroService.registrarComando(

            new ConsultarSaldoCommand()

        );

        this.cajeroService.registrarComando(

            new DepositarCommand()

        );

        this.cajeroService.registrarComando(

            new RetirarCommand()

        );

        this.cajeroService.registrarComando(

            new HistorialCommand()

        );

        Consola.limpiar();

        this.mostrarMenu();

    }

    private continuarInicio(): void {

        this.consola.question(

            "\nPresione ENTER para continuar...",

            () => {

                Consola.limpiar();

                Consola.titulo("CAJERO AUTOMÁTICO");

                this.pedirTarjeta();

            }

        );

    }



    private mostrarMenu(): void {

    if (!this.usuario) {

        return;

    }

    const cuenta = this.usuario.obtenerCuenta();

    Consola.titulo("CAJERO AUTOMÁTICO");

    Consola.informacion(
        `Titular: ${this.usuario.obtenerNombre()}`
    );

    Consola.informacion(
        `Número de cuenta: ${cuenta.obtenerNumeroCuenta()}`
    );

    Consola.informacion(
        `Tipo de cuenta: ${cuenta.obtenerTipoCuenta()}`
    );

    Consola.informacion("");
    Consola.informacion("1. Consultar saldo");
    Consola.informacion("2. Depositar dinero");
    Consola.informacion("3. Retirar dinero");
    Consola.informacion("4. Ver historial");
    Consola.informacion("5. Salir");

    Consola.informacion("");

    this.consola.question(

        "Seleccione una opción: ",

        (opcion: string) => {

            this.ejecutarOpcion(opcion);

        }

    );

    }

    private ejecutarOpcion(opcion: string): void {

        if (!this.cajeroService) {

            return;

        }

        switch (opcion) {

            case "1":

                Consola.limpiar();

                this.cajeroService.ejecutar("saldo");

                this.continuar();

                break;

            case "2":

                this.pedirMonto(

                    "DEPOSITAR DINERO",

                    "depositar"

                );

                break;

            case "3":

                this.pedirMonto(

                    "RETIRAR DINERO",

                    "retirar"

                );

                break;

            case "4":

                Consola.limpiar();

                this.cajeroService.ejecutar("historial");

                this.continuar();

                break;

            case "5":

                Consola.limpiar();

                Consola.informacion("Gracias por utilizar el cajero.");

                this.consola.close();

                break;

            default:

                Consola.error("Opción inválida.");

                this.continuar();

                break;

        }

    }

    private pedirMonto(
        titulo: string,
        comando: string
    ): void {

        if (!this.cajeroService) {

            return;

        }

        // Guardamos una referencia al cajero para usarla dentro del callback
        const cajero = this.cajeroService;
        Consola.limpiar();
        Consola.titulo(titulo);

        this.consola.question(

            "Ingrese el monto: ",

            (texto: string) => {

                const monto = Number(texto);
                cajero.ejecutar(comando, monto);
                this.continuar();

            }

        );

    }

    private continuar(): void {

        this.consola.question(

            "\nPresione ENTER para continuar...",

            () => {

                Consola.limpiar();

                this.mostrarMenu();

            }

        );

    }
}