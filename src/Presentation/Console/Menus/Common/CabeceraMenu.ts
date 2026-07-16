import { Usuario } from "../../../../Application/models/Usuario";
import { Consola } from "../../../../shared/utils/Consola";
import { SesionAutenticada } from "../Autenticacion/LoginMenu";

export class CabeceraMenu {

    public static mostrar(
        sesion: SesionAutenticada
        ): void {

        Consola.titulo("CAJERO AUTOMÁTICO");

        Consola.informacion(
            `Número de cuenta: ${sesion.numeroCuenta}`
        );

        Consola.informacion(
            `Saldo actual: $${sesion.saldo}`
        );

        Consola.informacion("");

    }

}