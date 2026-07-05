"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formato = void 0;
class Formato {
    static dinero(monto) {
        return `$${monto.toFixed(2)}`;
    }
    static fecha(fecha) {
        return fecha.toLocaleString();
    }
}
exports.Formato = Formato;
