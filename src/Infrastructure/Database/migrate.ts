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
        const sql = readFileSync(path.resolve(__dirname, '../../../Base De Datos/Banco-Cajero-Practica.sql'), 'utf8');
        await client.query(sql);
        console.log('Migraciones aplicadas correctamente');
    } finally {
        await client.end();
    }
}
