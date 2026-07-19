import { Transaccion } from "../../Domain/Entities/Transaccion";

export interface ITransaccionStore {
    guardar(transaccion: Transaccion): unknown | Promise<unknown>;
}