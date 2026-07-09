import { Resultado, ResultadoOperacion } from "../../../common/Resultado";
import { TransaccionRepository } from "../../../repositories/TransaccionRepository";
import { Transaccion } from "../../../models/Transaccion";

export class ConsultarHistorialOperacion {
    constructor(
        private transaccionRepository: TransaccionRepository
    ) {}

    public ejecutar(): Resultado<Transaccion[]> {
        return ResultadoOperacion.exitoso(
            this.transaccionRepository.obtenerTodas()
        );
    }
}