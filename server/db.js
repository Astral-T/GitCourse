import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'piloto_curiosidad'
};

let pool;

export async function initDatabase() {
  // Conectar al pool principal apuntando a la base de datos
  pool = new pg.Pool(dbConfig);
  console.log(`Conectado a la base de datos Postgres: ${dbConfig.database}`);

  // Inicializar las tablas leyendo init.sql
  try {
    const sqlPath = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Tablas inicializadas correctamente desde init.sql');
  } catch (err) {
    console.error('Error al ejecutar el script de inicialización init.sql:', err);
  }
}

export function query(text, params) {
  if (!pool) {
    throw new Error('El pool de base de datos no ha sido inicializado. Llama a initDatabase() primero.');
  }
  return pool.query(text, params);
}

export default {
  initDatabase,
  query
};
