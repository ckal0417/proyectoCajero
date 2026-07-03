import * as readline from "readline";
import { Cuenta } from "./models/Cuenta";
import { Cajero } from "./services/Cajero";
import { ConsultarSaldoCommand } from "./commands/ConsultarSaldoCommand";
import { DepositarCommand } from "./commands/DepositarCommand";
import { RetirarCommand } from "./commands/RetirarCommand";
import { MainMenu } from "./menus/MainMenu";
import { HistorialCommand } from "./commands/HistorialCommand";

// =======================================
// Crear la cuenta del usuario
// =======================================

const cuenta = new Cuenta(
    "Christopher Vera",
    500
);

// =======================================
// Crear el cajero
// =======================================

const cajero = new Cajero(cuenta);

// =======================================
// Registrar los comandos
// =======================================

cajero.agregarComando(new ConsultarSaldoCommand());
cajero.agregarComando(new DepositarCommand());
cajero.agregarComando(new RetirarCommand());
cajero.agregarComando(new HistorialCommand());

// =======================================
// Crear la consola
// =======================================

const consola = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// =======================================
// Iniciar el menú principal
// =======================================

const menu = new MainMenu(
    cajero,
    consola
);

menu.iniciar();