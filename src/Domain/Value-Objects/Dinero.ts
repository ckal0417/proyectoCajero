
export class Dinero {
    private constructor(private readonly centavos: number) {}
    
  /** Crea un Dinero a partir de un monto decimal, ej. Dinero.desde(1200.50) */
    static desde(monto: number): Dinero {
        if (!Number.isFinite(monto)) {
            throw new Error('El monto debe ser un número finito');
        }
    // Redondeamos a 2 decimales ANTES de convertir a centavos, para
    const centavos = Math.round(monto * 100);
    return new Dinero(centavos);
    }
    
    static cero(): Dinero {
        return new Dinero(0);
    }
    
    sumar(otro: Dinero): Dinero {
        return new Dinero(this.centavos + otro.centavos);
    }
    

    // restar() ya no valida negativos — se vuelve una operación aritmética pura:
    restar(otro: Dinero): Dinero {
        return new Dinero(this.centavos - otro.centavos);
    }

    esMayorOIgualQue(otro: Dinero): boolean {
        return this.centavos >= otro.centavos;
    }

    // Nuevos métodos que faltaban:
    esMayorQue(otro: Dinero): boolean {
        return this.centavos > otro.centavos;
    }

    esMenorQue(otro: Dinero): boolean {
        return this.centavos < otro.centavos;
    }
    
    esPositivo(): boolean {
        return this.centavos > 0;
    }
    
    /** Valor listo para persistir en una columna NUMERIC(15,2) */
    toNumber(): number {
        return this.centavos / 100;
    }
    
    toString(): string {
        return this.toNumber().toFixed(2);
    }
    
    equals(otro: Dinero): boolean {
    return this.centavos === otro.centavos;
    }
}