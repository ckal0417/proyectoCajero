import { Evento } from "../events/Evento";
import { IEventSubscriber } from "../interfaces/IEventSubscriber";
import { Consola } from "../utils/Consola";

export class CorreoSubscriber implements IEventSubscriber {
    public manejar(evento: Evento): void {
        Consola.informacion(`[CORREO] Notificación enviada al usuario por: ${evento.nombre}`);
    }
}