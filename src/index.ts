import * as readline from "readline";
import { BancoService } from "./services/BancoService";
import { MainMenu } from "./menus/MainMenu";
import { UsuarioRepository } from "./repositories/UsuarioRepository";

const usuarioRepository = new UsuarioRepository();

const bancoService = new BancoService(

    usuarioRepository

);

const leerlinea = readline.createInterface({

    input: process.stdin,

    output: process.stdout

});

const menu = new MainMenu(

    bancoService,

    leerlinea

);

menu.iniciar();