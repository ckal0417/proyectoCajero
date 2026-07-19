import { Evento } from "../../shared/events/Evento";
import { IEventSubscriber } from "../../Application/interfaces/IEventSubscriber";
import { ITransaccionStore } from "../../Application/Ports/ITransaccionStore";
import { Transaccion } from "../../Domain/Entities/Transaccion";

export class HistorialSubscriber implements IEventSubscriber<Transaccion> {
    constructor(
        private transaccionRepository: ITransaccionStore
    ) {}

    public manejar(evento: Evento<Transaccion>): void {
        this.transaccionRepository.guardar(evento.datos);
    }
}