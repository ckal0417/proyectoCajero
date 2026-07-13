export interface Evento<T = unknown> {
    nombre: string;
    datos: T;
}