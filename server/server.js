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

// Endpoint de Salud
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor del Portal de Curiosidad y Simulación activo.',
    time: new Date()
  });
});

// Rutas de la API
app.use('/api/news', newsRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/learning', learningRouter);
app.use('/api/dev', devRouter);

// Servir estáticos de client/dist con resolución de ruta absoluta tolerante
const clientDistPath = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.includes('.')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.error('ALERTA: No se encontro la carpeta client/dist en:', clientDistPath);
}

// Inicializar base de datos y arrancar servidor
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
