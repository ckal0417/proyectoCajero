"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CajeroService = void 0;
const Consola_1 = require("../utils/Consola");
class CajeroService {
    cuenta;
    comandos = [];
    constructor(cuenta) {
        this.cuenta = cuenta;
    }
    registrarComando(comando) {
        this.comandos.push(comando);
    }
    ejecutar(nombreComando, monto) {
        const comando = this.comandos.find(comando => comando.nombre === nombreComando);
        if (!comando) {
            Consola_1.Consola.error("El comando no existe.");
            return;
        }
        try {
            comando.ejecutar(this.cuenta, monto);
        }
        catch (error) {
            Consola_1.Consola.error(error.message);
        }
    }
}
exports.CajeroService = CajeroService;
