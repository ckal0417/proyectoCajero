"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
class Usuario {
    nombre;
    numeroTarjeta;
    pin;
    cuenta;
    constructor(nombre, numeroTarjeta, pin, cuenta) {
        this.nombre = nombre;
        this.numeroTarjeta = numeroTarjeta;
        this.pin = pin;
        this.cuenta = cuenta;
    }
    obtenerNombre() {
        return this.nombre;
    }
    obtenerNumeroTarjeta() {
        return this.numeroTarjeta;
    }
    obtenerPin() {
        return this.pin;
    }
    obtenerCuenta() {
        return this.cuenta;
    }
}
exports.Usuario = Usuario;
