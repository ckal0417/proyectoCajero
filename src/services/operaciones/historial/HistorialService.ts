import { Resultado, ResultadoOperacion } from "../../../common/Resultado";
import { TransaccionRepository } from "../../../repositories/TransaccionRepository";
import { Transaccion } from "../../../models/Transaccion";

export class HistorialService {
    constructor(
        private transaccionRepository: TransaccionRepository
    ) {}

    public ejecutar(): Resultado<Transaccion[]> {
        return ResultadoOperacion.exitoso(
            this.transaccionRepository.obtenerTodas()
        );
    }
}