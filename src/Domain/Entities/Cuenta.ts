import { TipoCuenta } from "../Enums/TiposDominio";
import { Dinero } from "../Value-Objects/Dinero";
import { NumeroCuenta } from "../Value-Objects/NumeroCuenta";
import { CuentaInactivaError, FondosInsuficientesError, MontoInvalidoError } from "../../Shared/Errors";


/** Entidad Cuenta — el AGGREGATE ROOT más importante del dominio.*/
export class Cuenta {
  private constructor(
    private readonly id: number | undefined,
    private readonly numeroCuenta: NumeroCuenta,
    private readonly tipo: TipoCuenta,
    private saldo: Dinero,
    private readonly fechaCreacion: Date,
    private activa: boolean,
    private readonly idCliente: number,
    private readonly idBanco: number,
  ) {}

  static crear(datos: {
    numeroCuenta: NumeroCuenta;
    tipo: TipoCuenta;
    idCliente: number;
    idBanco: number;
    saldoInicial?: Dinero;
  }): Cuenta {
    return new Cuenta(
      undefined,
      datos.numeroCuenta,
      datos.tipo,
      datos.saldoInicial ?? Dinero.cero(),
      new Date(),
      true,
      datos.idCliente,
      datos.idBanco,
    );
  }

  static reconstruir(datos: {
    id: number;
    numeroCuenta: NumeroCuenta;
    tipo: TipoCuenta;
    saldo: Dinero;
    fechaCreacion: Date;
    activa: boolean;
    idCliente: number;
    idBanco: number;
  }): Cuenta {
    return new Cuenta(
      datos.id,
      datos.numeroCuenta,
      datos.tipo,
      datos.saldo,
      datos.fechaCreacion,
      datos.activa,
      datos.idCliente,
      datos.idBanco,
    );
  }

  /**
   * Retira dinero de la cuenta. Devuelve el saldo ANTERIOR
   */
  retirar(monto: Dinero): { saldoAnterior: Dinero; saldoNuevo: Dinero } {
    this.asegurarActiva();
    if (!monto.esPositivo()) {
      throw new MontoInvalidoError('El monto a retirar debe ser mayor a cero');
    }
    if (!this.tieneFondosSuficientes(monto)) {
      throw new FondosInsuficientesError();
    }
    const saldoAnterior = this.saldo;
    this.saldo = this.saldo.restar(monto);
    return { saldoAnterior, saldoNuevo: this.saldo };
  }

  depositar(monto: Dinero): { saldoAnterior: Dinero; saldoNuevo: Dinero } {
    this.asegurarActiva();
    if (!monto.esPositivo()) {
      throw new MontoInvalidoError('El monto a depositar debe ser mayor a cero');
    }
    const saldoAnterior = this.saldo;
    this.saldo = this.saldo.sumar(monto);
    return { saldoAnterior, saldoNuevo: this.saldo };
  }

  private asegurarActiva(): void {
    if (!this.activa) {
      throw new CuentaInactivaError(`La cuenta ${this.numeroCuenta.toString()} no está activa`);
    }
  }

  bloquear(): void {
    this.activa = false;
  }

  reactivar(): void {
    this.activa = true;
  }

  tieneFondosSuficientes(monto: Dinero): boolean {
    return this.saldo.esMayorOIgualQue(monto);
  }

  // Getters de solo lectura
  obtenerId(): number | undefined {
    return this.id;
  }

  obtenerIdBanco(): number {   
    return this.idBanco;
  }

  obtenerTipo(): TipoCuenta { 
    return this.tipo;
  }

  obtenerSaldo(): Dinero {
    return this.saldo;
  }

  obtenerNumeroCuenta(): NumeroCuenta {
    return this.numeroCuenta;
  }

  obtenerIdCliente(): number {
    return this.idCliente;
  }

  estaActiva(): boolean {
    return this.activa;
  }
}