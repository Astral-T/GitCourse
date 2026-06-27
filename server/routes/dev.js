import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/dev/reset-demo - Limpieza segura de datos de demostración y transacciones
router.post('/reset-demo', async (req, res) => {
  try {
    await db.query('BEGIN');
    
    // 1. Limpiar únicamente tablas de historial de transacciones y portafolio simulado
    await db.query('TRUNCATE TABLE trading_history RESTART IDENTITY');
    await db.query('DELETE FROM user_portfolio');
    
    // 2. Restablecer el balance inicial de demostración a $10,000.00
    await db.query('UPDATE user_profile SET balance = 10000.0000 WHERE id = 1');
    
    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Datos de prueba y transacciones simuladas limpiados correctamente sin afectar la estructura ni configuraciones.'
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al ejecutar reset-demo:', err);
    res.status(500).json({ error: 'Error interno al reiniciar los datos de demostración.' });
  }
});

// GET /api/dev/reset-demo - Permitir pruebas sencillas desde el navegador
router.get('/reset-demo', async (req, res) => {
  try {
    await db.query('BEGIN');
    await db.query('TRUNCATE TABLE trading_history RESTART IDENTITY');
    await db.query('DELETE FROM user_portfolio');
    await db.query('UPDATE user_profile SET balance = 10000.0000 WHERE id = 1');
    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Datos de prueba y transacciones simuladas limpiados correctamente (GET).'
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al ejecutar reset-demo:', err);
    res.status(500).json({ error: 'Error interno al reiniciar los datos de demostración.' });
  }
});

export default router;
