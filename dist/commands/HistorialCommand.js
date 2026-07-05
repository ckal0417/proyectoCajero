"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorialCommand = void 0;
const Consola_1 = require("../utils/Consola");
class HistorialCommand {
    nombre = "historial";
    ejecutar(cuenta) {
        Consola_1.Consola.titulo("HISTORIAL");
        const historial = cuenta.obtenerHistorial();
        if (historial.length === 0) {
            Consola_1.Consola.informacion("No existen movimientos todavía.");
            return;
        }
        historial.forEach(transaccion => {
            Consola_1.Consola.informacion(transaccion.mostrar());
        });
    }
}
exports.HistorialCommand = HistorialCommand;
