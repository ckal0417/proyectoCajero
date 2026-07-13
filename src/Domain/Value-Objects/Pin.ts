export class PinTextoPlano {
    private static readonly PATRON = /^\d{4}$/;
    
    private constructor(private readonly valor: string) {}
    
    static desde(valor: string): PinTextoPlano {
        if (!PinTextoPlano.PATRON.test(valor)) {
            throw new Error('El PIN debe ser de exactamente 4 dígitos numéricos');
        }
        return new PinTextoPlano(valor);
    }
    
    valorCompleto(): string {
        return this.valor;
    }
    
    /** Nunca se debe imprimir el PIN real, ni en errores ni en logs */
    toString(): string {
        return '****';
    }
}