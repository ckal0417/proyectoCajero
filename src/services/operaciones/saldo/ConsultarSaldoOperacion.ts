import { Resultado, ResultadoOperacion } from "../../../common/Resultado";
import { CuentaRepository } from "../../../repositories/CuentaRepository";

export class ConsultarSaldoOperacion {
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