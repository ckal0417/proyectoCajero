import { Resultado, ResultadoOperacion } from "../../models/Resultado";
import { TransaccionRepository } from "../../../Infrastructure/repositories/TransaccionRepository";
import { Transaccion } from "../../models/Transaccion";

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