import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';
import newsRouter from './routes/news.js';
import tradingRouter from './routes/trading.js';
import learningRouter from './routes/learning.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
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

// Inicializar base de datos y arrancar servidor
async function startServer() {
  try {
    console.log('Inicializando servidor...');
    await db.initDatabase();
    
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Servidor ejecutándose en: http://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Error crítico al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

startServer();
