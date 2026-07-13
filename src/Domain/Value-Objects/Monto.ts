export class Monto {
    
    constructor(private readonly value: number ) {
        if (value < 0) 
            throw new Error('El monto no puede ser negativo');
    }

    getValue(): number {
        return this.value;
    }
}