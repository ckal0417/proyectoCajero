import { Consola } from "../../../../shared/utils/Consola";
import { SesionAutenticada } from "../Autenticacion/LoginMenu";

export class CabeceraMenu {

    public static mostrar(
        sesion: SesionAutenticada
        ): void {

        Consola.titulo("CAJERO AUTOMÁTICO");

        Consola.informacion(`Cliente: ${sesion.nombre}`);

        Consola.informacion(`Número de cuenta: ${sesion.numeroCuenta}`);

    }

}