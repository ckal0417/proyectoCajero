export type TipoTransaccion = "DEPOSITO" | "RETIRO" | "CONSULTA";

export class Transaccion {
  constructor(
    public tipo: TipoTransaccion,
    public monto: number,
    public fecha: Date
  ) {}

  mostrar(): string {
    return `${this.tipo} | $${this.monto} | ${this.fecha.toLocaleString()}`;
  }
}