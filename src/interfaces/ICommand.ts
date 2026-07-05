import { Cuenta } from "../models/Cuenta";

export interface ICommand {
    nombre: string;
    ejecutar(cuenta: Cuenta, monto?: number): void;
}