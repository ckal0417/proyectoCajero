import { BancoService } from '../../Application/services/BancoService';
import { CuentaRepository } from './CuentaRepository';
import { TransaccionRepository } from './TransaccionRepository';

export class RepositoryFactory {
    public static crear(bancoService: BancoService): {
        cuentaRepository: CuentaRepository;
        transaccionRepository: TransaccionRepository;
    } {
        const cuentas = bancoService.obtenerCuentasRegistradas();

        return {
            cuentaRepository: new CuentaRepository(cuentas),
            transaccionRepository: new TransaccionRepository(),
        };
    }
}
