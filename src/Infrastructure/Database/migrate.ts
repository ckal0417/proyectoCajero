import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

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
                WHERE table_schema = 'BancoFuego' AND table_name = 'banco'
            ) as exists
        `);

        const tableExists = checkResult.rows[0]?.exists === true;

        if (tableExists) {
            console.log('✅ Base de datos ya existe. Saltando migraciones.');
            return;
        }

        console.log('📋 Creando esquema y tablas...');
        const sql = readFileSync(path.resolve(__dirname, '../../../Base de datos/Banco-Cajero-Practica.sql'), 'utf8');
        
        // Ejecutar el SQL completo en una transacción
        await client.query('BEGIN');
        try {
            await client.query(sql);
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
        } else {
            throw error;
        }
    } finally {
        await client.end();
    }
}

if (require.main === module || (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate')))) {
    runMigrations()
        .then(() => {
            console.log('✅ Proceso de migración finalizado.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('❌ Error ejecutando migración:', err);
            process.exit(1);
        });
}
