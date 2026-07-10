import { Usuario } from "../models/Usuario";
import { Consola } from "../utils/Consola";

export class CabeceraMenu {

    public static mostrar(
        usuario: Usuario
    ): void {

        const cuenta = usuario.obtenerCuenta();

        Consola.titulo("CAJERO AUTOMÁTICO");

        Consola.informacion(
            `Titular: ${usuario.obtenerNombre()}`
        );

        Consola.informacion(
            `Número de cuenta: ${cuenta.obtenerNumeroCuenta()}`
        );

        Consola.informacion(
            `Tipo de cuenta: ${cuenta.obtenerTipoCuenta()}`
        );

        Consola.informacion("");

    }

}