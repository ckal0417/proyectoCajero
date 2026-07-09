import { Evento } from "../events/Evento";
import { IEventSubscriber } from "../interfaces/IEventSubscriber";
import { TransaccionRepository } from "../repositories/TransaccionRepository";
import { Transaccion } from "../models/Transaccion";

export class HistorialSubscriber implements IEventSubscriber<Transaccion> {
    constructor(
        private transaccionRepository: TransaccionRepository
    ) {}

    public manejar(evento: Evento<Transaccion>): void {
        this.transaccionRepository.guardar(evento.datos);
    }
}