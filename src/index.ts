import * as readline from "readline";
import { BancoService } from "./services/BancoService";
import { MainMenu } from "./menus/MainMenu";

const bancoService = new BancoService();

const leerlinea = readline.createInterface({

    input: process.stdin,

    output: process.stdout

});

const menu = new MainMenu(

    bancoService,

    leerlinea

);

menu.iniciar();