import { Evento } from "../events/Evento";
import { IEventSubscriber } from "../interfaces/IEventSubscriber";
import { Consola } from "../utils/Consola";

export class LogSubscriber implements IEventSubscriber {
    public manejar(evento: Evento): void {
        Consola.informacion(`[LOG] Evento recibido: ${evento.nombre}`);
    }
}