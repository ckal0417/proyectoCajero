import { Router } from 'express';
import { CuentaController } from './controllers/CuentaController';
import { RetiroController } from './controllers/RetiroController';
import { DepositoController } from './controllers/DepositoController';
import { TarjetaController } from './controllers/TarjetaController';
import { TransferenciaController } from './controllers/TransferenciaController';
import { validateBody, validateParams } from './validation';
import { serveOpenApiSpec, serveSwaggerUi } from './swagger';

const router = Router();
const cuentaController = new CuentaController();
const retiroController = new RetiroController();
const depositoController = new DepositoController();
const tarjetaController = new TarjetaController();
const transferenciaController = new TransferenciaController();

router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/docs', serveSwaggerUi);
router.get('/openapi.json', serveOpenApiSpec);

router.get('/cuentas/:id', validateParams(['id']), (req, res) => {
    void cuentaController.obtenerCuenta(req, res);
});

router.post('/retiros', validateBody(['numeroTarjeta', 'pin', 'monto', 'idCajero']), (req, res, next) => {
    void retiroController.retirar(req, res, next);
});

router.post('/cuentas/:id/depositos', validateParams(['id']), validateBody(['monto']), (req, res, next) => {
    void depositoController.depositar(req, res, next);
});

router.post('/transferencias', validateBody(['origenId', 'destinoId', 'monto']), (req, res, next) => {
    void transferenciaController.transferir(req, res, next);
});

router.get('/tarjetas/:numeroTarjeta/estado', validateParams(['numeroTarjeta']), (req, res) => {
    void tarjetaController.estado(req, res);
});

export default router;
