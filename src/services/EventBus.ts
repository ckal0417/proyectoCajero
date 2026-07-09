import { Evento } from "../events/Evento";

export class EventBus {

    private eventos = new Map<
        string,
        Array<(evento: Evento) => void>
    >();

    public suscribir(

        nombreEvento: string,

        callback: (evento: Evento) => void

    ): void {

        const lista = this.eventos.get(nombreEvento);

        if (lista) {

            lista.push(callback);

            return;

        }

        this.eventos.set(

            nombreEvento,

            [callback]

        );

    }

    public publicar(evento: Evento): void {

        const lista = this.eventos.get(

            evento.nombre

        );

        if (!lista) {

            return;

        }

        lista.forEach(

            callback => callback(evento)

        );

    }

}