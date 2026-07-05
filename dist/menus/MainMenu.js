"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainMenu = void 0;
const CajeroService_1 = require("../services/CajeroService");
const Consola_1 = require("../utils/Consola");
const ConsultarSaldoCommand_1 = require("../commands/ConsultarSaldoCommand");
const DepositarCommand_1 = require("../commands/DepositarCommand");
const RetirarCommand_1 = require("../commands/RetirarCommand");
const HistorialCommand_1 = require("../commands/HistorialCommand");
class MainMenu {
    bancoService;
    consola;
    usuario = null;
    cajeroService = null;
    constructor(bancoService, consola) {
        this.bancoService = bancoService;
        this.consola = consola;
    }
    iniciar() {
        Consola_1.Consola.limpiar();
        Consola_1.Consola.titulo("CAJERO AUTOMÁTICO");
        this.pedirTarjeta();
    }
    pedirTarjeta() {
        this.consola.question("Ingrese el número de la tarjeta: ", (numeroTarjeta) => {
            const usuario = this.bancoService.buscarPorTarjeta(numeroTarjeta);
            if (!usuario) {
                Consola_1.Consola.error("Tarjeta no encontrada.");
                return this.continuarInicio();
            }
            this.usuario = usuario;
            this.pedirPin();
        });
    }
    pedirPin() {
        this.consola.question("Ingrese su PIN: ", (pin) => {
            if (!this.usuario ||
                !this.bancoService.validarPin(this.usuario, pin)) {
                Consola_1.Consola.error("PIN incorrecto.");
                return this.continuarInicio();
            }
            this.prepararSesion();
        });
    }
    prepararSesion() {
        if (!this.usuario) {
            return;
        }
        this.cajeroService = new CajeroService_1.CajeroService(this.usuario.obtenerCuenta());
        this.cajeroService.registrarComando(new ConsultarSaldoCommand_1.ConsultarSaldoCommand());
        this.cajeroService.registrarComando(new DepositarCommand_1.DepositarCommand());
        this.cajeroService.registrarComando(new RetirarCommand_1.RetirarCommand());
        this.cajeroService.registrarComando(new HistorialCommand_1.HistorialCommand());
        Consola_1.Consola.limpiar();
        this.mostrarMenu();
    }
    continuarInicio() {
        this.consola.question("\nPresione ENTER para continuar...", () => {
            Consola_1.Consola.limpiar();
            Consola_1.Consola.titulo("CAJERO AUTOMÁTICO");
            this.pedirTarjeta();
        });
    }
    mostrarMenu() {
        if (!this.usuario) {
            return;
        }
        const cuenta = this.usuario.obtenerCuenta();
        Consola_1.Consola.titulo("CAJERO AUTOMÁTICO");
        Consola_1.Consola.informacion(`Titular: ${this.usuario.obtenerNombre()}`);
        Consola_1.Consola.informacion(`Número de cuenta: ${cuenta.obtenerNumeroCuenta()}`);
        Consola_1.Consola.informacion(`Tipo de cuenta: ${cuenta.obtenerTipoCuenta()}`);
        Consola_1.Consola.informacion("");
        Consola_1.Consola.informacion("1. Consultar saldo");
        Consola_1.Consola.informacion("2. Depositar dinero");
        Consola_1.Consola.informacion("3. Retirar dinero");
        Consola_1.Consola.informacion("4. Ver historial");
        Consola_1.Consola.informacion("5. Salir");
        Consola_1.Consola.informacion("");
        this.consola.question("Seleccione una opción: ", (opcion) => {
            this.ejecutarOpcion(opcion);
        });
    }
    ejecutarOpcion(opcion) {
        if (!this.cajeroService) {
            return;
        }
        switch (opcion) {
            case "1":
                Consola_1.Consola.limpiar();
                this.cajeroService.ejecutar("saldo");
                this.continuar();
                break;
            case "2":
                this.pedirMonto("DEPOSITAR DINERO", "depositar");
                break;
            case "3":
                this.pedirMonto("RETIRAR DINERO", "retirar");
                break;
            case "4":
                Consola_1.Consola.limpiar();
                this.cajeroService.ejecutar("historial");
                this.continuar();
                break;
            case "5":
                Consola_1.Consola.limpiar();
                Consola_1.Consola.informacion("Gracias por utilizar el cajero.");
                this.consola.close();
                break;
            default:
                Consola_1.Consola.error("Opción inválida.");
                this.continuar();
                break;
        }
    }
    pedirMonto(titulo, comando) {
        if (!this.cajeroService) {
            return;
        }
        // Guardamos una referencia al cajero para usarla dentro del callback
        const cajero = this.cajeroService;
        Consola_1.Consola.limpiar();
        Consola_1.Consola.titulo(titulo);
        this.consola.question("Ingrese el monto: ", (texto) => {
            const monto = Number(texto);
            cajero.ejecutar(comando, monto);
            this.continuar();
        });
    }
    continuar() {
        this.consola.question("\nPresione ENTER para continuar...", () => {
            Consola_1.Consola.limpiar();
            this.mostrarMenu();
        });
    }
}
exports.MainMenu = MainMenu;
