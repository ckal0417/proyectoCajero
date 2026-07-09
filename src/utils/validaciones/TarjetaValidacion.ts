import { Resultado } from "../../common/Resultado";

export class TarjetaValidacion {

    public static validar(numeroTarjeta: string): Resultado<string> {

        const tarjetaLimpia = numeroTarjeta.trim();

        if (tarjetaLimpia.length === 0) {
            return {
                exitoso: false,
                error: "Debe ingresar el número de la tarjeta."
            };
        }

        if (!/^\d+$/.test(tarjetaLimpia)) {
            return {
                exitoso: false,
                error: "La tarjeta solo debe contener números."
            };
        }

        if (tarjetaLimpia.length < 12) {
            return {
                exitoso: false,
                error: "El número de tarjeta es demasiado corto."
            };
        }

        return {
            exitoso: true,
            valor: tarjetaLimpia
        };

    }

}