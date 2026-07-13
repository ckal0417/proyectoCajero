import { Resultado, ResultadoOperacion } from "../../models/Resultado";
import { CuentaRepository } from "../../../Infrastructure/repositories/CuentaRepository";

export class SaldoService {
    constructor(
        private cuentaRepository: CuentaRepository
    ) {}

    public ejecutar(numeroCuenta: string): Resultado<number> {
        const cuenta = this.cuentaRepository.obtenerPorNumero(numeroCuenta);

        if (!cuenta) {
            return ResultadoOperacion.fallido("Cuenta no encontrada.");
        }

        return ResultadoOperacion.exitoso(
            cuenta.consultarSaldo()
        );
    }
}