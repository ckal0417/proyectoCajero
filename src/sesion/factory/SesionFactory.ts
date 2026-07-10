import { Usuario } from "../../models/Usuario";
import { BancoService } from "../../services/banco/BancoService";
import { CajeroService } from "../../services/cajero/CajeroService";
import { EventBus } from "../../events/EventBus";
import { RepositoryFactory } from "../../repositories/Factory/RepositoryFactory";
import { SubscriberFactory } from "../../subscribers/Factory/SubscriberFactory";
import { ServiceFactory } from "../../services/Factory/ServiceFactory";
import { CommandFactory } from "../../commands/factory/CommandFactory";

export class SesionFactory {

    public static crear(
        usuario: Usuario,
        bancoService: BancoService
    ): CajeroService {

        const repositories =
            RepositoryFactory.crear(
                bancoService
            );

        const eventBus =
            new EventBus();

        SubscriberFactory.crear(
            eventBus,
            repositories.transaccionRepository
        );

        const services =
            ServiceFactory.crear(
                repositories.cuentaRepository,
                repositories.transaccionRepository,
                eventBus
            );

        const cajeroService =
            new CajeroService(
                usuario.obtenerCuenta()
            );

        CommandFactory.registrar(
            cajeroService,
            services
        );

        return cajeroService;

    }

}