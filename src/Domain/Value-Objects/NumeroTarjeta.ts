export class NumeroTarjeta {
    private static readonly LONGITUD = 16;
    private static readonly PATRON = /^\d{16}$/;
    private static readonly VALIDAR_CHECKSUM = process.env.VALIDAR_LUHN_TARJETA === 'true';
  
    private constructor(private readonly valor: string) {}
  
    static desde(valor: string): NumeroTarjeta {
      const valorNormalizado = valor.replace(/[\s-]/g, '');

      if (!NumeroTarjeta.PATRON.test(valorNormalizado)) {
        throw new Error(
          `El número de tarjeta debe tener exactamente ${NumeroTarjeta.LONGITUD} dígitos`,
        );
      }

      if (NumeroTarjeta.VALIDAR_CHECKSUM && !NumeroTarjeta.pasaLuhn(valorNormalizado)) {
        throw new Error('El número de tarjeta no es válido (falla checksum)');
      }

      return new NumeroTarjeta(valorNormalizado);
    }
    
  /** Algoritmo de Luhn: el mismo checksum que usan las redes de tarjetas reales */
    private static pasaLuhn(numero: string): boolean {
      let suma = 0;
      let esSegundoDigito = false;
      
      for (let i = numero.length - 1; i >= 0; i--) {
        let digito = Number(numero[i]);
          if (esSegundoDigito) {
            digito *= 2;
          if (digito > 9) digito -= 9;
          }
        suma += digito;
        esSegundoDigito = !esSegundoDigito;
      }
    
      return suma % 10 === 0;
    }
    
  /** Valor completo — usar SOLO para persistir o comparar, nunca para mostrar/loguear */
  valorCompleto(): string {
    return this.valor;
  }
  
  /** Versión segura para UI y logs, ej. '************1111' */
  enmascarado(): string {
    return '*'.repeat(this.valor.length - 4) + this.valor.slice(-4);
  }
  
  toString(): string {
    return this.enmascarado();
  }
  
  equals(otro: NumeroTarjeta): boolean {
    return this.valor === otro.valor;
  }
}