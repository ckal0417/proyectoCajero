import { Resultado } from "../../../Application/models/Resultado";

export class TarjetaValidacion {

    public static validar(numeroTarjeta: string): Resultado<string> {

        const tarjetaLimpia = numeroTarjeta.trim();

        if (tarjetaLimpia.length === 0) {
            return {
                estado: false,
                error: "Debe ingresar el número de la tarjeta."
            };
        }

        if (!/^\d+$/.test(tarjetaLimpia)) {
            return {
                estado: false,
                error: "La tarjeta solo debe contener números."
            };
        }

        if (tarjetaLimpia.length < 12) {
            return {
                estado: false,
                error: "El número de tarjeta es demasiado corto."
            };
        }

        return {
            estado: true,
            valor: tarjetaLimpia
        };

    }

}