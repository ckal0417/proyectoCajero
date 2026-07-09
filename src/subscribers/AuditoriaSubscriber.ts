import { Evento } from "../events/Evento";
import { IEventSubscriber } from "../interfaces/IEventSubscriber";
import { Consola } from "../utils/Consola";

export class AuditoriaSubscriber implements IEventSubscriber {
    public manejar(evento: Evento): void {
        Consola.informacion(`[AUDITORÍA] Operación registrada: ${evento.nombre}`);
    }
}