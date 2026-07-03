import { Cuenta } from "../models/Cuenta";
import { ICommand } from "../commands/ICommand";

export class Cajero {
  private comandos: ICommand[];

  constructor(private cuenta: Cuenta) {
    this.comandos = [];
  }

  agregarComando(comando: ICommand): void {
    this.comandos.push(comando);
  }

  ejecutar(nombreComando: string, monto?: number): void {
    const comando = this.comandos.find(
      comando => comando.nombre === nombreComando
    );

    if (!comando) {
      console.log("Comando no encontrado.");
      this.mostrarAyuda();
      return;
    }

    try {
      comando.ejecutar(this.cuenta, monto);
    } catch (error) {
      console.log((error as Error).message);
    }
  }

  mostrarHistorial(): void {
    const historial = this.cuenta.obtenerHistorial();

    console.log("=== HISTORIAL ===");

    if (historial.length === 0) {
      console.log("No hay movimientos todavía.");
      return;
    }

    historial.forEach(transaccion => {
      console.log(transaccion.mostrar());
    });
  }

  mostrarAyuda(): void {
    console.log(`
Comandos disponibles:

saldo
depositar 100
retirar 50
historial
salir
`);
  }
}