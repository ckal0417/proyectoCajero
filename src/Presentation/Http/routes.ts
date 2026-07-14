import { Router } from 'express';
import { loginController } from './controllers/AuthController';
import {
    obtenerSaldoController,
    depositarController,
    retirarController,
    transferirController,
    obtenerHistorialController,
} from './controllers/OperacionesController';
import { verificarToken } from './middleware/AuthMiddleware';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica un usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numeroTarjeta:
 *                 type: string
 *                 example: "4111111111111111"
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/auth/login', loginController);

/**
 * @swagger
 * /operaciones/saldo:
 *   get:
 *     summary: Obtiene el saldo de la cuenta
 *     tags: [Operaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saldo:
 *                   type: number
 *       401:
 *         description: No autorizado
 */
router.get('/operaciones/saldo', verificarToken, obtenerSaldoController);

/**
 * @swagger
 * /operaciones/depositar:
 *   post:
 *     summary: Realiza un depósito
 *     tags: [Operaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Depósito exitoso
 *       400:
 *         description: Monto inválido
 *       401:
 *         description: No autorizado
 */
router.post('/operaciones/depositar', verificarToken, depositarController);

/**
 * @swagger
 * /operaciones/retirar:
 *   post:
 *     summary: Realiza un retiro
 *     tags: [Operaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Retiro exitoso
 *       400:
 *         description: Fondos insuficientes o monto inválido
 *       401:
 *         description: No autorizado
 */
router.post('/operaciones/retirar', verificarToken, retirarController);

/**
 * @swagger
 * /operaciones/transferir:
 *   post:
 *     summary: Realiza una transferencia
 *     tags: [Operaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numeroCuentaDestino:
 *                 type: string
 *                 example: "2200000002"
 *               monto:
 *                 type: number
 *                 example: 200
 *     responses:
 *       200:
 *         description: Transferencia exitosa
 *       400:
 *         description: Cuenta no encontrada o fondos insuficientes
 *       401:
 *         description: No autorizado
 */
router.post('/operaciones/transferir', verificarToken, transferirController);

/**
 * @swagger
 * /operaciones/historial:
 *   get:
 *     summary: Obtiene el historial de transacciones
 *     tags: [Operaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 historial:
 *                   type: array
 *       401:
 *         description: No autorizado
 */
router.get('/operaciones/historial', verificarToken, obtenerHistorialController);

export default router;
