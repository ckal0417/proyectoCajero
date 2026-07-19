import { Dinero } from "../../Domain/Value-Objects/Dinero";

export interface SolicitudTransferenciaInterbancaria {
    bancoOrigen: string;
    bancoDestino: string;
    numeroCuentaOrigen: string;
    numeroCuentaDestino: string;
    montoTransferencia: Dinero;
    //idTransaccion: string;
    fecha: Date;
}

export type ResultadoTransferenciaInterbancaria = 
| { estado: "ACEPTADA"; referencia: string;}
| { estado: "RECHAZADA"; codigoError: string }
| { estado: "PENDIENTE"; referenciaExterna: string };

export type IRedBancariaClient = {
    realizarTransferenciaInterbancaria(solicitud: SolicitudTransferenciaInterbancaria): 
        Promise<ResultadoTransferenciaInterbancaria>;
    consultarEstado(referenciaExterna: string): 
        Promise<ResultadoTransferenciaInterbancaria>;
};