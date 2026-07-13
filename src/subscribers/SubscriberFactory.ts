import { EventBus } from "../shared/events/EventBus";
import { Evento } from "../shared/events/Evento";
import { TiposEvento } from "../shared/events/TiposEvento";
import { Transaccion } from "../Application/models/Transaccion";
import { TransaccionRepository } from "../Infrastructure/repositories/TransaccionRepository";
import { HistorialSubscriber } from "./HistorialSubscriber";
import { LogSubscriber } from "./LogSubscriber";
import { AuditoriaSubscriber } from "./AuditoriaSubscriber";
import { CorreoSubscriber } from "./CorreoSubscriber";
export class SubscriberFactory {

    public static crear(
        eventBus: EventBus,
        transaccionRepository: TransaccionRepository
    ): void {

        const historialSubscriber =
            new HistorialSubscriber(
                transaccionRepository
            );

        const logSubscriber =
            new LogSubscriber();

        const auditoriaSubscriber =
            new AuditoriaSubscriber();

        const correoSubscriber =
            new CorreoSubscriber();

        const eventos = [

            TiposEvento.DEPOSITO_REALIZADO,

            TiposEvento.RETIRO_REALIZADO,

            TiposEvento.TRANSFERENCIA_REALIZADA

        ];

        eventos.forEach(

            nombreEvento => {

                eventBus.suscribir(

                    nombreEvento,

                    evento =>

                        historialSubscriber.manejar(

                            evento as Evento<Transaccion>

                        )

                );

                eventBus.suscribir(

                    nombreEvento,

                    evento =>

                        logSubscriber.manejar(evento)

                );

                eventBus.suscribir(

                    nombreEvento,

                    evento =>

                        auditoriaSubscriber.manejar(evento)

                );

                eventBus.suscribir(

                    nombreEvento,

                    evento =>

                        correoSubscriber.manejar(evento)

                );

            }

        );

    }

}