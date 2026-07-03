import { Transaccion } from "./Transaccion";

export class Cuenta {
  private saldo: number;
  private historial: Transaccion[];

  constructor(
    public titular: string,
    saldoInicial: number
  ) {
    this.saldo = saldoInicial;
    this.historial = [];
  }

  consultarSaldo(): number {
    this.historial.push(new Transaccion("CONSULTA", this.saldo, new Date()));
    return this.saldo;
  }

  depositar(monto: number): void {
    if (monto <= 0) {
      throw new Error("El monto debe ser mayor a 0.");
    }

    this.saldo += monto;
    this.historial.push(new Transaccion("DEPOSITO", monto, new Date()));
  }

  retirar(monto: number): void {
    if (monto <= 0) {
      throw new Error("El monto debe ser mayor a 0.");
    }

    if (monto > this.saldo) {
      throw new Error("Saldo insuficiente.");
    }

    this.saldo -= monto;
    this.historial.push(new Transaccion("RETIRO", monto, new Date()));
  }

  obtenerHistorial(): Transaccion[] {
    return this.historial;
  }
}