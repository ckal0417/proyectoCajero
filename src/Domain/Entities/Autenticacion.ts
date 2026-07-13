import type { PinTextoPlano } from "../Value-Objects/Pin";
import type { IPinHasher } from "../Value-Objects/PinHasher";
import { BusinessRuleError } from "../../Shared/Errors";

// Entidad Autenticacion.

export class Autenticacion {
    // coincide con el seed: intentos=3 -> bloqueado=true
    private static readonly LIMITE_INTENTOS = 3; 

    private constructor(
        private readonly id: number | undefined,
        private pinHash: string,
        private intentos: number,
        private bloqueado: boolean,
        private readonly idTarjeta: number,
    ) {}

    static crear(datos: { pinHash: string; idTarjeta: number }): Autenticacion {
        return new Autenticacion(undefined, datos.pinHash, 0, false, datos.idTarjeta);
    }

    static reconstruir(datos: {
        id: number;
        pinHash: string;
        intentos: number;
        bloqueado: boolean;
        idTarjeta: number;
    }): Autenticacion {
    return new Autenticacion(
      datos.id,
      datos.pinHash,
      datos.intentos,
      datos.bloqueado,
      datos.idTarjeta,
    );
  }

  /**
   * Verifica el PIN ingresado contra el hash guardado.
   * Encapsula TODA la lógica de intentos/bloqueo en un solo lugar,
   * para que el servicio de aplicación no tenga que "recordar"
   * incrementar contadores ni chequear el límite manualmente.
   *
   * @param hasher puerto inyectado (implementado con bcrypt en infra)
   * @returns true si el PIN es correcto
   * @throws si la tarjeta ya está bloqueada
   */
  async verificarPin(pin: PinTextoPlano, hasher: IPinHasher): Promise<boolean> {
    if (this.bloqueado) {
      throw new BusinessRuleError('La tarjeta está bloqueada por demasiados intentos fallidos', 'TARJETA_BLOQUEADA', 403);
    }

    const esCorrecto = await hasher.verificar(pin, this.pinHash);

    if (esCorrecto) {
      this.intentos = 0;
    } else {
      this.registrarIntentoFallido();
    }

    return esCorrecto;
  }

  private registrarIntentoFallido(): void {
    this.intentos += 1;
    if (this.intentos >= Autenticacion.LIMITE_INTENTOS) {
      this.bloqueado = true;
    }
  }

  async cambiarPin(pinNuevo: PinTextoPlano, hasher: IPinHasher): Promise<void> {
    if (this.bloqueado) {
      throw new BusinessRuleError('No se puede cambiar el PIN de una tarjeta bloqueada', 'PIN_NO_MODIFICABLE', 403);
    }
    this.pinHash = await hasher.hashear(pinNuevo);
    this.intentos = 0;
  }

  /** Para que un empleado del banco desbloquee la tarjeta manualmente */
  desbloquear(): void {
    this.bloqueado = false;
    this.intentos = 0;
  }

  estaBloqueado(): boolean {
    return this.bloqueado;
  }

  obtenerIntentos(): number {
    return this.intentos;
  }

  obtenerPinHash(): string {
    return this.pinHash;
  }

  obtenerIdTarjeta(): number {
    return this.idTarjeta;
  }
}