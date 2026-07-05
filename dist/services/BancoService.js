"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BancoService = void 0;
const Usuario_1 = require("../models/Usuario");
const Cuenta_1 = require("../models/Cuenta");
class BancoService {
    // Memoria del banco
    usuarios;
    constructor() {
        this.usuarios = [
            new Usuario_1.Usuario("Cristopher Vera", "4587123412341234", "1234", new Cuenta_1.Cuenta("100001", "Ahorros", 500)),
            new Usuario_1.Usuario("Juan Pérez", "4587000000000001", "4321", new Cuenta_1.Cuenta("100002", "Corriente", 1200))
        ];
    }
    // Buscar usuario por número de tarjeta
    buscarPorTarjeta(numeroTarjeta) {
        const usuario = this.usuarios.find(usuario => usuario.obtenerNumeroTarjeta() === numeroTarjeta);
        return usuario ?? null;
    }
    // Validar PIN
    validarPin(usuario, pin) {
        return usuario.obtenerPin() === pin;
    }
}
exports.BancoService = BancoService;
