import http from 'http';
import { URL } from 'url';
import { AddressInfo } from 'net';
import { Dinero } from '../../Domain/Value-Objects/Dinero';
import { RedBancariaHttpClient } from './RedBancariaHttpClient';

interface MockTransferRequest {
    bancoDestino?: string;
}

function assertTrue(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function readJsonBody(req: http.IncomingMessage): Promise<MockTransferRequest> {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => {
            raw += String(chunk);
        });
        req.on('end', () => {
            if (!raw) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(raw) as MockTransferRequest);
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

async function createMockServer(): Promise<{ server: http.Server; baseUrl: string }> {
    const server = http.createServer(async (req, res) => {
        const method = req.method ?? 'GET';
        const requestUrl = new URL(req.url ?? '/', 'http://localhost');

        if (method === 'POST' && requestUrl.pathname === '/transferencias/interbancarias') {
            const body = await readJsonBody(req);
            const bancoDestino = String(body.bancoDestino ?? '').toUpperCase();

            if (bancoDestino === 'BANK_OK') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ estado: 'ACEPTADA', referencia: 'REF-OK-123' }));
                return;
            }

            if (bancoDestino === 'BANK_FAIL') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ estado: 'RECHAZADA', codigoError: 'ACCOUNT_INVALID' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ estado: 'PENDIENTE', referenciaExterna: 'REF-PEND-999' }));
            return;
        }

        if (method === 'GET' && requestUrl.pathname.startsWith('/transferencias/interbancarias/')) {
            const referencia = requestUrl.pathname.split('/').pop() ?? '';

            if (referencia === 'REF-OK-123') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ estado: 'ACEPTADA', referencia: referencia }));
                return;
            }

            if (referencia === 'REF-FAIL-123') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ estado: 'RECHAZADA', codigoError: 'SETTLEMENT_DENIED' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ estado: 'PENDIENTE', referenciaExterna: referencia || 'REF-PEND-999' }));
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'NOT_FOUND' }));
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => resolve());
    });

    const info = server.address() as AddressInfo;
    return { server, baseUrl: `http://127.0.0.1:${info.port}` };
}

async function run(): Promise<void> {
    const { server, baseUrl } = await createMockServer();
    const client = new RedBancariaHttpClient(baseUrl, 3000);

    try {
        const commonRequest = {
            bancoOrigen: 'BancoFuego',
            numeroCuentaOrigen: '1111111111',
            numeroCuentaDestino: '9999999999',
            montoTransferencia: Dinero.desde(100),
            fecha: new Date('2026-01-01T00:00:00.000Z'),
        };

        const aceptada = await client.realizarTransferenciaInterbancaria({
            ...commonRequest,
            bancoDestino: 'BANK_OK',
        });
        assertTrue(aceptada.estado === 'ACEPTADA', 'Escenario ACEPTADA no devolvio estado ACEPTADA');

        const rechazada = await client.realizarTransferenciaInterbancaria({
            ...commonRequest,
            bancoDestino: 'BANK_FAIL',
        });
        assertTrue(rechazada.estado === 'RECHAZADA', 'Escenario RECHAZADA no devolvio estado RECHAZADA');

        const pendiente = await client.realizarTransferenciaInterbancaria({
            ...commonRequest,
            bancoDestino: 'BANK_PENDING',
        });
        assertTrue(pendiente.estado === 'PENDIENTE', 'Escenario PENDIENTE no devolvio estado PENDIENTE');

        const estadoAceptada = await client.consultarEstado('REF-OK-123');
        assertTrue(estadoAceptada.estado === 'ACEPTADA', 'consultarEstado ACEPTADA fallo');

        const estadoRechazada = await client.consultarEstado('REF-FAIL-123');
        assertTrue(estadoRechazada.estado === 'RECHAZADA', 'consultarEstado RECHAZADA fallo');

        const estadoPendiente = await client.consultarEstado('REF-PEND-123');
        assertTrue(estadoPendiente.estado === 'PENDIENTE', 'consultarEstado PENDIENTE fallo');

        console.log('Smoke test OK: RedBancariaHttpClient valida ACEPTADA, RECHAZADA y PENDIENTE.');
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
}

run().catch((error) => {
    console.error('Smoke test FAIL:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
