"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositarCommand = void 0;
const Consola_1 = require("../utils/Consola");
const Validaciones_1 = require("../utils/Validaciones");
const Formato_1 = require("../utils/Formato");
class DepositarCommand {
    nombre = "depositar";
    ejecutar(cuenta, monto) {
        const montoValido = Validaciones_1.Validaciones.obtenerMontoValido(monto);
        cuenta.depositar(montoValido);
        Consola_1.Consola.exito("Depósito realizado correctamente.");
        Consola_1.Consola.informacion("");
        Consola_1.Consola.informacion(`Saldo actual: ${Formato_1.Formato.dinero(cuenta.obtenerSaldo())}`);
    }
}
exports.DepositarCommand = DepositarCommand;
