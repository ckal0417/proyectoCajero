export interface ICommand {

    nombre: string;
    ejecutar(...parametros: unknown[]): void;

}