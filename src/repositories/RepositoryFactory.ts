import { BancoService } from "../services/banco/BancoService";
import { CuentaRepository } from "./CuentaRepository";
import { TransaccionRepository } from "./TransaccionRepository";

export class RepositoryFactory {

    public static crear(
        bancoService: BancoService
    ) {

        const cuentasRegistradas =
            bancoService.obtenerCuentasRegistradas();

        const cuentaRepository =
            new CuentaRepository(
                cuentasRegistradas
            );

        const transaccionRepository =
            new TransaccionRepository();

        return {

            cuentaRepository,

            transaccionRepository

        };

    }

}