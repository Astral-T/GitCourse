import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/dev/reset-demo - Limpieza segura de datos de demostración, transacciones, sellos y pendientes
router.post('/reset-demo', async (req, res) => {
  try {
    await db.query('BEGIN');
    
    // 1. Limpiar historial de transacciones y portafolio simulado
    await db.query('TRUNCATE TABLE trading_history RESTART IDENTITY');
    await db.query('DELETE FROM user_portfolio');
    
    // 2. Restablecer el balance inicial de demostración a $10,000.00
    await db.query('UPDATE user_profile SET balance = 10000.0000 WHERE id = 1');
    
    // 3. Limpiar sellos del pasaporte y pendientes del desafío diario
    await db.query('DELETE FROM learning_cards');
    await db.query('DELETE FROM user_passports');
    
    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Reinicio completo (Fresh Start): Transacciones, balance, sellos del pasaporte y desafío diario limpiados correctamente.'
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
    await db.query('DELETE FROM learning_cards');
    await db.query('DELETE FROM user_passports');
    await db.query('COMMIT');

    res.json({
      success: true,
      message: 'Reinicio completo (Fresh Start): Transacciones, balance, sellos del pasaporte y desafío diario limpiados correctamente (GET).'
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al ejecutar reset-demo:', err);
    res.status(500).json({ error: 'Error interno al reiniciar los datos de demostración.' });
  }
});

export default router;
