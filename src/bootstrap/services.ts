import { AutenticacionRepositoryPostgres } from "../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres";
import { CuentaRepositoryPostgres } from "../Infrastructure/Database/Repositories/CuentaRepositoryPostgres";
import { TarjetaRepositoryPostgres } from "../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres";
import { PinHasherBcrypt } from "../Infrastructure/Persistence/PinHasherBcrypt";
import { AutenticacionService } from "../Application/services/AutenticationService";

const tarjetaRepository = new TarjetaRepositoryPostgres();
const autenticacionRepository = new AutenticacionRepositoryPostgres();
const cuentaRepository = new CuentaRepositoryPostgres();
const pinHasher = new PinHasherBcrypt();

export const autenticacionService = new AutenticacionService(
    tarjetaRepository,
    autenticacionRepository,
    cuentaRepository,
    pinHasher,
);