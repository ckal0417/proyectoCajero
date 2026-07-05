"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetirarCommand = void 0;
const Consola_1 = require("../utils/Consola");
const Validaciones_1 = require("../utils/Validaciones");
const Formato_1 = require("../utils/Formato");
class RetirarCommand {
    nombre = "retirar";
    ejecutar(cuenta, monto) {
        const montoValido = Validaciones_1.Validaciones.obtenerMontoValido(monto);
        cuenta.retirar(montoValido);
        Consola_1.Consola.exito("Retiro realizado correctamente.");
        Consola_1.Consola.informacion("");
        Consola_1.Consola.informacion(`Saldo actual: ${Formato_1.Formato.dinero(cuenta.obtenerSaldo())}`);
    }
}
exports.RetirarCommand = RetirarCommand;
