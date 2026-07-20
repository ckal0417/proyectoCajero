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
import { TransferenciaExternaEstadoService } from "../Application/services/operaciones/TransferenciaExternaEstadoService";
import { RedBancariaHttpClient } from "../Infrastructure/External/RedBancariaHttpClient";
import { TransferenciaExternaPollingWorker } from "../Infrastructure/Workers/TransferenciaExternaPollingWorker";
import { EventBus } from "../shared/events/EventBus";
import { TiposEvento } from "../shared/events/TiposEvento";
import { AuditoriaSubscriber } from "../Presentation/subscribers/AuditoriaSubscriber";
import { CorreoSubscriber } from "../Presentation/subscribers/CorreoSubscriber";
import { LogSubscriber } from "../Presentation/subscribers/LogSubscriber";

const tarjetaRepository = new TarjetaRepositoryPostgres();
const autenticacionRepository = new AutenticacionRepositoryPostgres();
const cuentaRepository = new CuentaRepositoryPostgres();
const pinHasher = new PinHasherBcrypt();
const pool = PostgresConnection.obtenerPool();
const cuentaQueryService = new CuentaOperacionQueryService(pool);
const idempotenciaService = new IdempotenciaService();
const redBancariaClient = RedBancariaHttpClient.desdeEnv();
const eventBus = new EventBus();

const auditoriaSubscriber = new AuditoriaSubscriber();
const correoSubscriber = new CorreoSubscriber();
const logSubscriber = new LogSubscriber();

eventBus.suscribir(TiposEvento.TRANSFERENCIA_REALIZADA, (evento) => {
    auditoriaSubscriber.manejar(evento);
});

eventBus.suscribir(TiposEvento.TRANSFERENCIA_REALIZADA, (evento) => {
    correoSubscriber.manejar(evento);
});

eventBus.suscribir(TiposEvento.TRANSFERENCIA_REALIZADA, (evento) => {
    logSubscriber.manejar(evento);
});

const obtenerSaldoService = new ObtenerSaldoService(cuentaRepository, cuentaQueryService);
const obtenerHistorialService = new ObtenerHistorialService(cuentaQueryService);
const consultaTitularCuentaService = new ConsultaTitularCuentaService(cuentaQueryService);
const depositoOperacionService = new DepositoOperacionService(pool, cuentaQueryService, idempotenciaService);
const retiroOperacionService = new RetiroOperacionService(pool, cuentaQueryService, idempotenciaService);
const transferenciaOperacionService = new TransferenciaOperacionService(
    pool,
    cuentaQueryService,
    idempotenciaService,
    redBancariaClient,
    eventBus,
);
const transferenciaExternaEstadoService = new TransferenciaExternaEstadoService(pool, redBancariaClient, eventBus);

const pollingInterval = Number(process.env.TRANSFERENCIA_EXTERNA_POLL_INTERVAL_MS ?? 15000);
const pollingBatchSize = Number(process.env.TRANSFERENCIA_EXTERNA_POLL_BATCH_SIZE ?? 50);

export const transferenciaExternaPollingWorker = new TransferenciaExternaPollingWorker(
    transferenciaExternaEstadoService,
    Number.isFinite(pollingInterval) ? pollingInterval : 15000,
    Number.isFinite(pollingBatchSize) ? pollingBatchSize : 50,
);

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

export { transferenciaExternaEstadoService };