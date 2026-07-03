export class Consola {

    // Limpia la pantalla
    public static limpiar(): void {

        console.clear();

    }

    // Muestra un título principal
    public static titulo(texto: string): void {

        console.log("===================================");
        console.log(`      ${texto}`);
        console.log("===================================\n");

    }

    // Línea separadora
    public static separador(): void {

        console.log("-----------------------------------");

    }

    // Mensaje de éxito
    public static exito(texto: string): void {

        console.log(`\n✔ ${texto}`);

    }

    // Mensaje de error
    public static error(texto: string): void {

        console.log(`\n❌ ${texto}`);

    }

    // Mensaje informativo
    public static informacion(texto: string): void {

        console.log(texto);

    }

}