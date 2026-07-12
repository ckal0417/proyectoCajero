import { Evento } from "./Evento";
import { Consola } from "../utils/Consola";

type CallbackEvento = (evento: Evento) => void;

export class EventBus {
    private suscriptores: Map<string, CallbackEvento[]> = new Map();

    public suscribir(nombreEvento: string, callback: CallbackEvento): void {
        const lista = this.suscriptores.get(nombreEvento);

        if (lista) {
            lista.push(callback);
            return;
        }

        this.suscriptores.set(nombreEvento, [callback]);
    }

    public publicar(evento: Evento): void {
        const lista = this.suscriptores.get(evento.nombre);

        if (!lista) {
            return;
        }

        lista.forEach(callback => {
            try {
                callback(evento);
            }
            catch (error) {
                const mensaje = error instanceof Error
                    ? error.message
                    : "Error desconocido";

                Consola.error(
                    `No fue posible ejecutar un suscriptor del evento ${evento.nombre}: ${mensaje}`
                );
            }
        });
    }
}