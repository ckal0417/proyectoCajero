import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Banco Fuego - API REST',
            version: '1.0.0',
            description: 'API REST para operaciones bancarias (Depósitos, Retiros, Transferencias, Consulta de Saldo)',
            contact: {
                name: 'Cristopher Vera',
                email: 'soporte@bancofuego.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor de desarrollo',
            },
            {
                url: 'https://api.bancofuego.com/api',
                description: 'Servidor de producción',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido al hacer login',
                },
            },
            schemas: {
                Usuario: {
                    type: 'object',
                    properties: {
                        nombre: {
                            type: 'string',
                            example: 'Cristopher Vera',
                        },
                        numeroTarjeta: {
                            type: 'string',
                            example: '4111111111111111',
                        },
                        saldo: {
                            type: 'number',
                            example: 500.5,
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/Presentation/Http/routes.ts'],
};

const specs = swaggerJsdoc(options);

const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, { explorer: true }));

export { specs };
export default router;
