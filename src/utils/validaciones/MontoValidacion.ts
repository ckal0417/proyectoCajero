import { Resultado } from "../../common/Resultado";

export class MontoValidacion {

    public static validar(monto: number | undefined): Resultado<number> {

        if (monto === undefined) {
            return {
                exitoso: false,
                error: "Debe ingresar un monto."
            };
        }

        if (isNaN(monto)) {
            return {
                exitoso: false,
                error: "Debe ingresar un número válido."
            };
        }

        if (monto <= 0) {
            return {
                exitoso: false,
                error: "El monto debe ser mayor que cero."
            };
        }

        return {
            exitoso: true,
            valor: monto
        };

    }

}