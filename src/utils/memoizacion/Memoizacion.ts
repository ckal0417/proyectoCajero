export class Memoizacion {

    public static memoizar<T extends (...args: any[]) => any>(funcion: T): T {

        const cache = new Map<string, ReturnType<T>>();

        return ((...args: Parameters<T>) => {

            const clave = JSON.stringify(args);

            const valorEnCache = cache.get(clave);

            if (valorEnCache !== undefined) {
                return valorEnCache;
            }

            const resultado = funcion(...args);

            cache.set(clave, resultado);

            return resultado;

        }) as T;

    }

}