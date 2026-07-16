import { TransaccionRepository } from "../../../Infrastructure/Database/Repositories/TransaccionRepository";
import { Resultado, ResultadoOperacion } from "../../models/Resultado";
export class HistorialService {
    constructor(
        private transaccionRepository: TransaccionRepository
    ) {}

    public ejecutar(): Resultado<any[]> {
        return ResultadoOperacion.exitoso(
            this.transaccionRepository.obtenerTodas()
        );
    }
}