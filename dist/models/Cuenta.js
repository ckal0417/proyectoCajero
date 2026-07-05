"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cuenta = void 0;
const Transaccion_1 = require("./Transaccion");
const TipoTransaccion_1 = require("./TipoTransaccion");
class Cuenta {
    numeroCuenta;
    tipoCuenta;
    saldo;
    historial = [];
    constructor(numeroCuenta, tipoCuenta, saldo) {
        this.numeroCuenta = numeroCuenta;
        this.tipoCuenta = tipoCuenta;
        this.saldo = saldo;
    }
    obtenerNumeroCuenta() {
        return this.numeroCuenta;
    }
    obtenerTipoCuenta() {
        return this.tipoCuenta;
    }
    obtenerSaldo() {
        return this.saldo;
    }
    obtenerHistorial() {
        return this.historial;
    }
    consultarSaldo() {
        this.registrarTransaccion(TipoTransaccion_1.TipoTransaccion.CONSULTA, this.saldo, "Consulta de saldo");
        return this.saldo;
    }
    depositar(monto) {
        this.saldo += monto;
        this.registrarTransaccion(TipoTransaccion_1.TipoTransaccion.DEPOSITO, monto, "Depósito realizado");
    }
    retirar(monto) {
        if (monto > this.saldo) {
            throw new Error("Saldo insuficiente.");
        }
        this.saldo -= monto;
        this.registrarTransaccion(TipoTransaccion_1.TipoTransaccion.RETIRO, monto, "Retiro realizado");
    }
    registrarTransaccion(tipo, monto, descripcion) {
        const transaccion = new Transaccion_1.Transaccion(undefined, tipo, monto, new Date(), descripcion);
        this.historial.push(transaccion);
    }
}
exports.Cuenta = Cuenta;
