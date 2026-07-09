import { Resultado } from "../common/Resultado";

export interface IOperacionBancaria<T = void> {

    ejecutar(): Resultado<T>;

}