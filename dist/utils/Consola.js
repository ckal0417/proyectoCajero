"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consola = void 0;
class Consola {
    static limpiar() {
        console.clear();
    }
    static titulo(texto) {
        console.log("===================================");
        console.log(`        ${texto}`);
        console.log("===================================\n");
    }
    static informacion(texto) {
        console.log(texto);
    }
    static exito(texto) {
        console.log(`\n ${texto}`);
    }
    static error(texto) {
        console.log(`\n ${texto}`);
    }
}
exports.Consola = Consola;
