import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

async function ensureOperationalTables(client: Client): Promise<void> {
    await client.query(`
        CREATE TABLE IF NOT EXISTS BancoFuego.IdempotenciaOperacion(
            id_idempotencia SERIAL PRIMARY KEY,
            numero_tarjeta VARCHAR(20) NOT NULL,
            endpoint VARCHAR(40) NOT NULL,
            idempotency_key VARCHAR(100) NOT NULL,
            request_hash VARCHAR(64) NOT NULL,
            estado VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO',
            respuesta_http INTEGER,
            respuesta_body JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_idempotencia_operacion UNIQUE (numero_tarjeta, endpoint, idempotency_key),
            CONSTRAINT chk_estado_idempotencia CHECK (estado IN ('EN_PROCESO', 'COMPLETADA'))
        );
    `);

    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_idempotencia_lookup
        ON BancoFuego.IdempotenciaOperacion(numero_tarjeta, endpoint, idempotency_key);
    `);

    await client.query(`
        ALTER TABLE BancoFuego.Transaccion
            ADD COLUMN IF NOT EXISTS referencia_externa VARCHAR(120);
    `);

    await client.query(`
        ALTER TABLE BancoFuego.Transaccion
            ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
    `);

    await client.query(`
        ALTER TABLE BancoFuego.Transaccion
            ADD COLUMN IF NOT EXISTS estado_detalle TEXT;
    `);

    await client.query(`
        ALTER TABLE BancoFuego.Transaccion
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
}

export async function runMigrations() {
    const client = new Client({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME ?? 'BancoFuego',
        user: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'Admin123456',
    });

    await client.connect();
    try {
        // Verificar si el esquema BancoFuego existe y tiene datos
        const checkResult = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'bancofuego' AND table_name = 'banco'
            ) as exists
        `);

        const tableExists = checkResult.rows[0]?.exists === true;

        if (tableExists) {
            await ensureOperationalTables(client);
            console.log('✅ Base de datos ya existe. Saltando migraciones.');
            return;
        }

        console.log('📋 Creando esquema y tablas...');
        const sql = readFileSync(path.resolve(__dirname, '../../../Base De Datos/Banco-Cajero-Practica.sql'), 'utf8');
        
        // Ejecutar el SQL completo en una transacción
        await client.query('BEGIN');
        try {
            await client.query(sql);
            await ensureOperationalTables(client);
            await client.query('COMMIT');
            console.log('✅ Migraciones completadas correctamente');
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Error en migraciones:', errorMsg);
        
        // Si el error es por "ya existe", no es crítico en desarrollo
        if (errorMsg.includes('ya existe') || errorMsg.includes('already exists')) {
            console.log('⚠️  Tablas o tipos ya existen. Continuando...');
            await ensureOperationalTables(client);
        } else {
            throw error;
        }
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    runMigrations().catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Migración abortada:', errorMsg);
        process.exit(1);
    });
}
