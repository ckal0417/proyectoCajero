import * as readline from "readline";
import { Cuenta } from "./models/Cuenta";
import { Cajero } from "./services/Cajero";
import { ConsultarSaldoCommand } from "./commands/ConsultarSaldoCommand";
import { DepositarCommand } from "./commands/DepositarCommand";
import { RetirarCommand } from "./commands/RetirarCommand";

const cuenta = new Cuenta("Cristopher Vera", 500);
const cajero = new Cajero(cuenta);

cajero.agregarComando(new ConsultarSaldoCommand());
cajero.agregarComando(new DepositarCommand());
cajero.agregarComando(new RetirarCommand());

const consola = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=== CAJERO AUTOMÁTICO ===");
cajero.mostrarAyuda();

consola.on("line", (texto: string) => {
  const partes: string[] = texto.split(" ");

  const comando: string = partes[0];
  const monto: number | undefined = partes[1]
    ? Number(partes[1])
    : undefined;

  if (comando === "salir") {
    console.log("Gracias por usar el cajero.");
    consola.close();
    return;
  }

  if (comando === "historial") {
    cajero.mostrarHistorial();
    return;
  }

  cajero.ejecutar(comando, monto);
});