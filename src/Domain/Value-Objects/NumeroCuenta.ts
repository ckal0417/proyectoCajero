export class NumeroCuenta {
    private static readonly LONGITUD = 10;
    private static readonly PATRON = /^\d+$/;
    
    private constructor(private readonly valor: string) {}
    
    static desde(valor: string): NumeroCuenta {
        if (!NumeroCuenta.PATRON.test(valor)) {
            throw new Error('El número de cuenta debe contener solo dígitos');
        }
        if (valor.length !== NumeroCuenta.LONGITUD) {
            throw new Error(
                `El número de cuenta debe tener ${NumeroCuenta.LONGITUD} dígitos`,
            );
        }
        return new NumeroCuenta(valor);
    }
    
    //Genera el siguiente número de cuenta a partir de un consecutivo..
    static generar(consecutivo: number, prefijo = '2200'): NumeroCuenta {
        const relleno = String(consecutivo).padStart(
            NumeroCuenta.LONGITUD - prefijo.length,
            '0',
            );
        return NumeroCuenta.desde(prefijo + relleno);
    }
    
    toString(): string {
        return this.valor;
    }
    
    equals(otro: NumeroCuenta): boolean {
        return this.valor === otro.valor;
    }
}