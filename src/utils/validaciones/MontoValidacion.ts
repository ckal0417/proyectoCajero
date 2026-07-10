import { Resultado } from "../../common/Resultado";

export class MontoValidacion {

    public static validar(monto: number | undefined): Resultado<number> {

        if (monto === undefined) {
            return {
                estado: false,
                error: "Debe ingresar un monto."
            };
        }

        if (isNaN(monto)) {
            return {
                estado: false,
                error: "Debe ingresar un número válido."
            };
        }

        if (monto <= 0) {
            return {
                estado: false,
                error: "El monto debe ser mayor que cero."
            };
        }

        return {
            estado: true,
            valor: monto
        };

    }

}