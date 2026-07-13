import { Resultado } from "../models/Resultado";

export interface IOperacionBancaria<T = void> {

    ejecutar(): Resultado<T>;

}