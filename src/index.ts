import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as readline from 'readline';
import { runMigrations } from './Infrastructure/Database/migrate';
import routes from './Presentation/Http/routes';
import swaggerRouter from './Presentation/Http/swagger';
import logger from './shared/Logger';
import { MainMenu } from './Presentation/Console/Menus/MainMenu';

const APP_MODE = process.env.APP_MODE ?? 'console';

const app: Express = express();
const port = Number(process.env.PORT ?? 3000);

// Middlewares de seguridad
app.use(helmet());
app.use(cors());

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Rutas
app.use('/api', routes);

// Swagger docs
app.use('/docs', swaggerRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});


async function iniciarAplicacion() {
    try {
        logger.info('📋 Ejecutando migraciones de base de datos...');
        await runMigrations();
        logger.info('✅ Migraciones completadas');

        app.listen(port, () => {
            logger.info(`🚀 Servidor ejecutándose en http://localhost:${port}`);
            logger.info(`📚 Documentación en http://localhost:${port}/docs`);
        });
    } catch (error) {
        logger.error('❌ Error iniciando aplicación:', error);
        process.exit(1);
    }
}

function iniciarConsola(): void {
    const consola = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const mainMenu = new MainMenu(consola);
    mainMenu.iniciar();
}


if (APP_MODE === 'console') {
    iniciarConsola();
} 
else {
    iniciarAplicacion();
}