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
  // 1. Intentar conectar a la base de datos destino para ver si existe
  const tempPool = new pg.Pool({
    user: dbConfig.user,
    password: dbConfig.password,
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'postgres' // Conectarse a la db por defecto primero
  });

  try {
    const res = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );

    if (res.rowCount === 0) {
      console.log(`Base de datos '${dbConfig.database}' no existe. Creándola...`);
      // Evitar transacciones para CREATE DATABASE
      await tempPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Base de datos '${dbConfig.database}' creada con éxito.`);
    }
  } catch (err) {
    console.error('Error al verificar/crear la base de datos en Postgres:', err.message);
  } finally {
    await tempPool.end();
  }

  // 2. Conectar al pool principal apuntando a la base de datos del proyecto
  pool = new pg.Pool(dbConfig);
  console.log(`Conectado a la base de datos Postgres: ${dbConfig.database}`);

  // 3. Inicializar las tablas leyendo init.sql
  try {
    const sqlPath = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Tablas inicializadas correctamente desde init.sql');
  } catch (err) {
    console.error('Error al ejecutar el script de inicialización init.sql:', err.message);
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
