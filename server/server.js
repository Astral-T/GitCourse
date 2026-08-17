import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './db.js';
import newsRouter from './routes/news.js';
import tradingRouter from './routes/trading.js';
import learningRouter from './routes/learning.js';
import devRouter from './routes/dev.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Orígenes permitidos: producción (ALLOWED_ORIGIN) + desarrollo local
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,          // Ej: https://portal-piloto.onrender.com
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean); // elimina entradas undefined si la var no está definida

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (curl, Postman, SSR) y orígenes en lista blanca
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json());

// ── Archivos estáticos: prioridad máxima, antes de cualquier otra ruta ────────
const distPath = path.resolve(__dirname, '../client/dist');

console.log('Ruta de estáticos client/dist:', distPath);
if (fs.existsSync(distPath)) {
  console.log('Archivos en dist:', fs.readdirSync(distPath));
  if (fs.existsSync(path.join(distPath, 'assets'))) {
    console.log('Archivos en dist/assets:', fs.readdirSync(path.join(distPath, 'assets')));
  }
}

// 1. Servir archivos estáticos con prioridad máxima
app.use(express.static(distPath));
app.use('/assets', express.static(path.join(distPath, 'assets')));

// ── Rutas de la API ───────────────────────────────────────────────────────────

// Endpoint de Salud
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor del Portal de Curiosidad y Simulación activo.',
    time: new Date()
  });
});

app.use('/api/news', newsRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/learning', learningRouter);
app.use('/api/dev', devRouter);

// 3. SPA Fallback: Si no es /api ni un archivo con extensión, servir index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const filePath = path.join(distPath, 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('client/dist/index.html no encontrado');
  }
});

// ── Inicializar base de datos y arrancar servidor ─────────────────────────────
async function startServer() {
  try {
    console.log('Inicializando servidor...');
    await db.initDatabase();

    // Escuchar en 0.0.0.0 para ser accesible en entornos cloud (Render, Railway, etc.)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` Servidor ejecutándose en: http://0.0.0.0:${PORT}`);
      console.log(` Orígenes CORS permitidos: ${allowedOrigins.join(', ')}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Error crítico al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

startServer();
