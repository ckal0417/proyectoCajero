"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaccion = void 0;
const Formato_1 = require("../utils/Formato");
class Transaccion {
    id;
    tipo;
    monto;
    fecha;
    descripcion;
    static contador = 1;
    constructor(id = Transaccion.contador++, tipo, monto, fecha, descripcion) {
        this.id = id;
        this.tipo = tipo;
        this.monto = monto;
        this.fecha = fecha;
        this.descripcion = descripcion;
    }
    mostrar() {
        return `
-----------------------------------
ID: ${this.id}
Tipo: ${this.tipo}
Monto: ${Formato_1.Formato.dinero(this.monto)}
Fecha: ${Formato_1.Formato.fecha(this.fecha)}
Descripción: ${this.descripcion}
-----------------------------------`;
    }
}
exports.Transaccion = Transaccion;
