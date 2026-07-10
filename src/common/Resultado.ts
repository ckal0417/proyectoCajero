export type Resultado<T> =
    | { estado: true; valor: T }
    | { estado: false; error: string };

export class ResultadoOperacion {

    public static exitoso<T>(valor: T): Resultado<T> {
        return {
            estado: true,
            valor
        };
    }

    public static fallido<T>(error: string): Resultado<T> {
        return {
            estado: false,
            error
        };
    }

}