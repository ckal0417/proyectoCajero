import { AutenticacionRepositoryPostgres } from "../Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres";
import { CuentaRepositoryPostgres } from "../Infrastructure/Database/Repositories/CuentaRepositoryPostgres";
import { PostgresConnection } from "../Infrastructure/Database/PostgresConnection";
import { TarjetaRepositoryPostgres } from "../Infrastructure/Database/Repositories/TarjetaRepositoryPostgres";
import { PinHasherBcrypt } from "../Infrastructure/Persistence/PinHasherBcrypt";
import { AutenticacionService } from "../Application/services/AutenticationService";
import { OperacionesBancariasService } from "../Application/services/OperacionesBancariasService";
import { CuentaOperacionQueryService } from "../Application/services/operaciones/CuentaOperacionQueryService";
import { IdempotenciaService } from "../Application/services/operaciones/IdempotenciaService";
import { ObtenerSaldoService } from "../Application/services/operaciones/ObtenerSaldoService";
import { ObtenerHistorialService } from "../Application/services/operaciones/ObtenerHistorialService";
import { ConsultaTitularCuentaService } from "../Application/services/operaciones/ConsultaTitularCuentaService";
import { DepositoOperacionService } from "../Application/services/operaciones/DepositoOperacionService";
import { RetiroOperacionService } from "../Application/services/operaciones/RetiroOperacionService";
import { TransferenciaOperacionService } from "../Application/services/operaciones/TransferenciaInternaService";

const tarjetaRepository = new TarjetaRepositoryPostgres();
const autenticacionRepository = new AutenticacionRepositoryPostgres();
const cuentaRepository = new CuentaRepositoryPostgres();
const pinHasher = new PinHasherBcrypt();
const pool = PostgresConnection.obtenerPool();
const cuentaQueryService = new CuentaOperacionQueryService(pool);
const idempotenciaService = new IdempotenciaService();

const obtenerSaldoService = new ObtenerSaldoService(cuentaRepository, cuentaQueryService);
const obtenerHistorialService = new ObtenerHistorialService(cuentaQueryService);
const consultaTitularCuentaService = new ConsultaTitularCuentaService(cuentaQueryService);
const depositoOperacionService = new DepositoOperacionService(pool, cuentaQueryService, idempotenciaService);
const retiroOperacionService = new RetiroOperacionService(pool, cuentaQueryService, idempotenciaService);
const transferenciaOperacionService = new TransferenciaOperacionService(pool, cuentaQueryService, idempotenciaService);

export const autenticacionService = new AutenticacionService(
    tarjetaRepository,
    autenticacionRepository,
    cuentaRepository,
    pinHasher,
);

export const operacionesBancariasService = new OperacionesBancariasService({
    obtenerSaldoService,
    obtenerHistorialService,
    consultaTitularCuentaService,
    depositoOperacionService,
    retiroOperacionService,
    transferenciaOperacionService,
});