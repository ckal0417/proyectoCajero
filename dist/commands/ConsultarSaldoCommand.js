"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultarSaldoCommand = void 0;
const Consola_1 = require("../utils/Consola");
const Formato_1 = require("../utils/Formato");
class ConsultarSaldoCommand {
    nombre = "saldo";
    ejecutar(cuenta) {
        Consola_1.Consola.titulo("CONSULTAR SALDO");
        const saldo = cuenta.consultarSaldo();
        Consola_1.Consola.informacion(`Cuenta: ${cuenta.obtenerNumeroCuenta()}`);
        Consola_1.Consola.informacion(`Saldo actual: ${Formato_1.Formato.dinero(saldo)}`);
    }
}
exports.ConsultarSaldoCommand = ConsultarSaldoCommand;
