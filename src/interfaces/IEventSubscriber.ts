import { Evento } from "../events/Evento";

export interface IEventSubscriber<T = unknown> {
    manejar(evento: Evento<T>): void;
}