export type Resultado<T = void> =
    | { estado: true; valor: T }
    | { estado: false; error: string };

export class ResultadoOperacion {

    public static exitoso<T = void>(valor: T): Resultado<T> {
        return {
            estado: true,
            valor
        };
    }

    public static fallido<T = void>(error: string): Resultado<T> {
        return {
            estado: false,
            error
        };
    }

}
