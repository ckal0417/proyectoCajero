import { Dinero } from "../../../../../Domain/Value-Objects/Dinero";
import { NumeroCuenta } from "../../../../../Domain/Value-Objects/NumeroCuenta";
import { Cuenta } from "../../../../models/Cuenta";
import { Transaccion } from "../../../../../Domain/Entities/Transaccion";
import { ICuentaRepository } from "../../../../Ports/ICuentaRepository";
import { IRedBancariaClient } from "../../../../Ports/IRedBancariaClient";
import { ITransaccionRepository } from "../../../../Ports/ITransaccionRepository";
import { TipoTransaccion } from "../../../../../Domain/enums/TipoTransaccion";
import { EstadoTransaccion } from "../../../../../Domain/enums/EstadoTransaccion";

export interface TransferirDineroDTO {
    numeroCuentaOrigen: string; 
    numeroCuentaDestino: string;
    bancoDestino: string;
    montoTransferencia: number;
}


interface BancoIntermediarioPort {
    procesarTransferencia(
        bancoOrigen: string,
        bancoDestino: string,
        numeroCuentaOrigen: string,
        numeroCuentaDestino: string,
        montoTransferencia: number
    ): boolean;
}

export class TransferenciaInterbancariaService {

    constructor(
        private readonly cuentaRepo: ICuentaRepository,
        private readonly transaccionRepo: ITransaccionRepository,
        private readonly redBancariaClient: IRedBancariaClient
    ) {}

    public transferir(
        _cuentaOrigen: Cuenta,
        bancoDestino: string,
        numeroCuentaDestino: string,
        montoTransferencia: number
    ): boolean {
        void this.ejecutar({
            numeroCuentaOrigen: _cuentaOrigen.obtenerNumeroCuenta().toString(),
            numeroCuentaDestino,
            bancoDestino,
            montoTransferencia,
        });

        return true;
    }

    async ejecutar(dto: TransferirDineroDTO): Promise<Transaccion> {
        return Transaccion.crear({
            tipo: TipoTransaccion.TRANSFERENCIA_INTERBANCARIA,
            monto: Dinero.desde(dto.montoTransferencia),
            estado: EstadoTransaccion.PENDIENTE,
            descripcion: `Solicitud interbancaria a ${dto.bancoDestino} - cuenta ${dto.numeroCuentaDestino}`,
        });
    }
}