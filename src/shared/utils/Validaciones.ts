export class Validaciones {
    public static obtenerMontoValido(monto: number | undefined): number {
        if (monto === undefined) {
            throw new Error("Debe ingresar un monto.");
        }

        if (isNaN(monto)) {
            throw new Error("Debe ingresar un número válido.");
        }

        if (monto <= 0) {
            throw new Error("El monto debe ser mayor que cero.");
        }

        return monto;
    }
}