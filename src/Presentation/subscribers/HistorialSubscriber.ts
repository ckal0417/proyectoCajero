import { Evento } from "../../shared/events/Evento";
import { IEventSubscriber } from "../../Application/interfaces/IEventSubscriber";
import { Transaccion } from "../../Domain/Entities/Transaccion";
import { TransaccionRepository } from "../../Infrastructure/Database/Repositories/TransaccionRepository";

export class HistorialSubscriber implements IEventSubscriber<Transaccion> {
    constructor(
        private transaccionRepository: TransaccionRepository
    ) {}

    public manejar(evento: Evento<Transaccion>): void {
        this.transaccionRepository.guardar(evento.datos);
    }
}