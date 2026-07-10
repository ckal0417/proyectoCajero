import { Resultado, ResultadoOperacion } from "../../common/Resultado";

export class TransferenciaValidacion {

    public static validar(
        numeroCuentaDestino: string,
        monto: number
    ): Resultado<void> {

        if (numeroCuentaDestino.trim().length === 0) {
            return ResultadoOperacion.fallido(
                "Debe ingresar la cuenta destino."
            );
        }

        if (isNaN(monto)) {
            return ResultadoOperacion.fallido(
                "Debe ingresar un monto válido."
            );
        }

        if (monto <= 0) {
            return ResultadoOperacion.fallido(
                "El monto debe ser mayor que cero."
            );
        }

        return ResultadoOperacion.exitoso(undefined);

    }

}