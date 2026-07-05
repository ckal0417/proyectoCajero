"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validaciones = void 0;
class Validaciones {
    static obtenerMontoValido(monto) {
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
exports.Validaciones = Validaciones;
