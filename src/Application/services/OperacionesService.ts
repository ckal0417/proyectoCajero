import { UsuarioRepository } from '../../Infrastructure/repositories/UsuarioRepository';
import { CuentaRepository } from '../../Infrastructure/repositories/CuentaRepository';
import { Resultado, ResultadoOperacion } from '../models/Resultado';

/**
 * Servicio para operaciones bancarias en la API REST
 */
export class OperacionesService {
    constructor(
        private usuarioRepository: UsuarioRepository,
        private cuentaRepository: CuentaRepository
    ) {}

    /**
     * Consulta el saldo de una cuenta por número de tarjeta
     */
    public consultarSaldo(numeroTarjeta: string): number | null {
        const usuario = this.usuarioRepository.obtenerPorNumeroTarjeta(numeroTarjeta);
        if (!usuario) {
            return null;
        }
        return usuario.obtenerCuenta().obtenerSaldo();
    }

    /**
     * Realiza un depósito a una cuenta
     */
    public depositar(numeroTarjeta: string, monto: number): Resultado<number> {
        if (monto <= 0) {
            return ResultadoOperacion.fallido('Monto debe ser mayor a 0');
        }

        const usuario = this.usuarioRepository.obtenerPorNumeroTarjeta(numeroTarjeta);
        if (!usuario) {
            return ResultadoOperacion.fallido('Cuenta no encontrada');
        }

        const cuenta = usuario.obtenerCuenta();
        const nuevoSaldo = cuenta.obtenerSaldo() + monto;
        cuenta.establecerSaldo(nuevoSaldo);

        return ResultadoOperacion.exitoso(nuevoSaldo);
    }

    /**
     * Realiza un retiro de una cuenta
     */
    public retirar(numeroTarjeta: string, monto: number): Resultado<number> {
        if (monto <= 0) {
            return ResultadoOperacion.fallido('Monto debe ser mayor a 0');
        }

        const usuario = this.usuarioRepository.obtenerPorNumeroTarjeta(numeroTarjeta);
        if (!usuario) {
            return ResultadoOperacion.fallido('Cuenta no encontrada');
        }

        const cuenta = usuario.obtenerCuenta();
        const saldoActual = cuenta.obtenerSaldo();

        if (saldoActual < monto) {
            return ResultadoOperacion.fallido('Fondos insuficientes');
        }

        const nuevoSaldo = saldoActual - monto;
        cuenta.establecerSaldo(nuevoSaldo);

        return ResultadoOperacion.exitoso(nuevoSaldo);
    }

    /**
     * Realiza una transferencia entre cuentas
     */
    public transferir(
        numeroTarjetaOrigen: string,
        numeroCuentaDestino: string,
        monto: number
    ): Resultado<number> {
        if (monto <= 0) {
            return ResultadoOperacion.fallido('Monto debe ser mayor a 0');
        }

        const usuarioOrigen = this.usuarioRepository.obtenerPorNumeroTarjeta(
            numeroTarjetaOrigen
        );
        if (!usuarioOrigen) {
            return ResultadoOperacion.fallido('Cuenta origen no encontrada');
        }

        // En un sistema real, buscaríamos la cuenta destino en la BD
        // Por ahora, usamos la lógica simple
        const cuentaOrigen = usuarioOrigen.obtenerCuenta();
        const saldoActual = cuentaOrigen.obtenerSaldo();

        if (saldoActual < monto) {
            return ResultadoOperacion.fallido('Fondos insuficientes');
        }

        const nuevoSaldo = saldoActual - monto;
        cuentaOrigen.establecerSaldo(nuevoSaldo);

        return ResultadoOperacion.exitoso(nuevoSaldo);
    }

    /**
     * Obtiene el historial de transacciones (simulado)
     */
    public obtenerHistorial(numeroTarjeta: string): Array<{
        tipo: string;
        monto: number;
        fecha: string;
    }> | null {
        const usuario = this.usuarioRepository.obtenerPorNumeroTarjeta(numeroTarjeta);
        if (!usuario) {
            return null;
        }

        // Simulación de historial (en producción vendría de la BD)
        return [
            {
                tipo: 'DEPOSITO',
                monto: 500,
                fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                tipo: 'RETIRO',
                monto: 100,
                fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];
    }
}
