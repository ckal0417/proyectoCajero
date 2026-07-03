import * as readline from "readline";
import { Cajero } from "../services/Cajero";
import { Consola } from "../utils/consola";

export class MainMenu {

    constructor(
        private cajero: Cajero,
        private consola: readline.Interface
    ) { }

    // Inicia el programa
    public iniciar(): void {
        Consola.limpiar();
        this.mostrarMenu();
    }

    // Muestra el menú principal
    private mostrarMenu(): void {

        Consola.titulo("CAJERO AUTOMÁTICO");
        console.log("\n1. Consultar saldo");
        console.log("2. Depositar dinero");
        console.log("3. Retirar dinero");
        console.log("4. Ver historial");
        console.log("5. Salir\n");

        this.consola.question("Seleccione una opción: ", (opcion: string) => {

            switch (opcion) {

                case "1":

                    console.clear();

                    this.cajero.ejecutar("saldo");

                    this.continuar();

                    break;

                case "2":

                    Consola.limpiar();
                    Consola.titulo("DEPOSITAR DINERO");

                    this.consola.question("Ingrese el monto: ", (texto: string) => {

                        const monto: number = Number(texto);

                        this.cajero.ejecutar("depositar", monto);

                        this.continuar();

                    });

                    break;

                case "3":

                    Consola.limpiar();
                    Consola.titulo("RETIRAR DINERO");

                    this.consola.question("Ingrese el monto: ", (texto: string) => {

                        const monto: number = Number(texto);

                        this.cajero.ejecutar("retirar", monto);

                        this.continuar();

                    });

                    break;

                case "4":

                    console.clear();

                    this.cajero.ejecutar("historial");

                    this.continuar();

                    break;

                case "5":

                    console.clear();

                    console.log("Gracias por utilizar el cajero.");

                    this.consola.close();

                    break;

                default:

                    console.clear();

                    Consola.error("Opción inválida.");

                    this.continuar();

                    break;

            }

        });

    }

    // Espera ENTER antes de volver al menú
    private continuar(): void {

        this.consola.question("\nPresione ENTER para continuar...", () => {

            console.clear();

            this.mostrarMenu();

        });

    }

}