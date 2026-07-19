export class BancoIntermediarioService {

    public procesarTransferencia(
        bancoOrigen: string,
        bancoDestino: string,
        numeroCuentaOrigen: string,
        numeroCuentaDestino: string,
        monto: number
    ): boolean {

        console.log("");
        console.log("=== BANCO INTERMEDIARIO ===");
        console.log(`Banco origen : ${bancoOrigen}`);
        console.log(`Banco destino: ${bancoDestino}`);
        console.log(`Cuenta origen: ${numeroCuentaOrigen}`);
        console.log(`Cuenta destino: ${numeroCuentaDestino}`);
        console.log(`Monto: $${monto.toFixed(2)}`);
        console.log("Transferencia interbancaria aprobada.");
        console.log("===========================");
        return true;

    }

}