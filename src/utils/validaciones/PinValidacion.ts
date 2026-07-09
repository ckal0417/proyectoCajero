import { Resultado } from "../../common/Resultado";

export class PinValidacion {

    public static validar(pin: string): Resultado<string> {

        const pinLimpio = pin.trim();

        if (pinLimpio.length === 0) {
            return {
                exitoso: false,
                error: "Debe ingresar el PIN."
            };
        }

        if (!/^\d+$/.test(pinLimpio)) {
            return {
                exitoso: false,
                error: "El PIN solo debe contener números."
            };
        }

        if (pinLimpio.length !== 4) {
            return {
                exitoso: false,
                error: "El PIN debe tener 4 dígitos."
            };
        }

        return {
            exitoso: true,
            valor: pinLimpio
        };

    }

}