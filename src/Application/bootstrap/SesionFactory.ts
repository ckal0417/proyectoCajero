import { Usuario } from "../models/Usuario";
import { BancoService } from "../services/BancoService";
import { CajeroService } from "../services/CajeroService";
import { EventBus } from "../../shared/events/EventBus";
import { RepositoryFactory } from "../../Infrastructure/repositories/RepositoryFactory";
import { SubscriberFactory } from "../../Presentation/subscribers/SubscriberFactory";
import { ServiceFactory } from "../services/ServiceFactory";
import { CommandFactory } from "../../commands/CommandFactory";

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