export interface ErrorResultado {
    mensaje: string;
    statusCode?: number;
    codigo?: string;
}

export type Resultado<T = void> =
    | { estado: true; valor: T }
    | { estado: false; error: string; statusCode?: number; codigo?: string };

export class ResultadoOperacion {

    public static exitoso<T = void>(valor: T): Resultado<T> {
        return {
            estado: true,
            valor
        };
    }

    public static fallido<T = void>(error: string | ErrorResultado): Resultado<T> {
        if (typeof error === 'string') {
            return {
                estado: false,
                error,
            };
        }

        return {
            estado: false,
            error: error.mensaje,
            statusCode: error.statusCode,
            codigo: error.codigo,
        };
    }

    public static obtenerMensajeError<T>(resultado: Resultado<T>): string {
        if (resultado.estado) {
            return '';
        }

        return resultado.error;
    }

    public static obtenerStatusError<T>(resultado: Resultado<T>, fallbackStatusCode: number = 400): number {
        if (resultado.estado) {
            return fallbackStatusCode;
        }

        return resultado.statusCode ?? fallbackStatusCode;
    }

}
