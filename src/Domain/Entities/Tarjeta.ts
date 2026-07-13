import { TipoTarjeta } from "../Enums/TiposDominio";
import { NumeroTarjeta } from "../Value-Objects/NumeroTarjeta";
import { ValidationError, TarjetaBloqueadaError, TarjetaVencidaError } from "../../Shared/Errors";

export class Tarjeta {
  private constructor(
    private readonly id: number | undefined,
    private readonly numeroTarjeta: NumeroTarjeta,
    private readonly tipo: TipoTarjeta,
    private readonly fechaVencimiento: Date,
    private readonly cvv: string, // nunca se expone en toString/logs
    private activa: boolean,
    private readonly idCuenta: number,
  ) {}

  static crear(datos: {
    numeroTarjeta: NumeroTarjeta;
    tipo: TipoTarjeta;
    fechaVencimiento: Date;
    cvv: string;
    idCuenta: number;
  }): Tarjeta {
    if (!/^\d{3,4}$/.test(datos.cvv)) {
      throw new ValidationError('El CVV debe tener 3 o 4 dígitos');
    }
    if (datos.fechaVencimiento <= new Date()) {
      throw new ValidationError('La fecha de vencimiento debe ser futura');
    }
    return new Tarjeta(
      undefined,
      datos.numeroTarjeta,
      datos.tipo,
      datos.fechaVencimiento,
      datos.cvv,
      true,
      datos.idCuenta,
    );
  }

  static reconstruir(datos: {
    id: number;
    numeroTarjeta: NumeroTarjeta;
    tipo: TipoTarjeta;
    fechaVencimiento: Date;
    cvv: string;
    activa: boolean;
    idCuenta: number;
  }): Tarjeta {
    return new Tarjeta(
      datos.id,
      datos.numeroTarjeta,
      datos.tipo,
      datos.fechaVencimiento,
      datos.cvv,
      datos.activa,
      datos.idCuenta,
    );
  }

  estaVencida(): boolean {
    return this.fechaVencimiento <= new Date();
  }

  estaActiva(): boolean {
    return this.activa && !this.estaVencida();
  }

  /** Valida que la tarjeta pueda usarse en una operación del cajero. Lanza si no. */
  asegurarUsable(): void {
    if (!this.activa) {
      throw new TarjetaBloqueadaError();
    }
    if (this.estaVencida()) {
      throw new TarjetaVencidaError();
    }
  }

  bloquear(): void {
    this.activa = false;
  }

  obtenerId(): number | undefined {
    return this.id;
  }

  obtenerIdCuenta(): number {
    return this.idCuenta;
  }

  obtenerNumeroTarjeta(): NumeroTarjeta {
    return this.numeroTarjeta;
  }
}