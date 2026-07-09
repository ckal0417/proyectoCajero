export type Resultado<T> =
    | { exitoso: true; valor: T }
    | { exitoso: false; error: string };

export class ResultadoOperacion {

    public static exitoso<T>(valor: T): Resultado<T> {
        return {
            exitoso: true,
            valor
        };
    }

    public static fallido<T>(error: string): Resultado<T> {
        return {
            exitoso: false,
            error
        };
    }

}