import express from 'express';
import yahooFinance from 'yahoo-finance2';
import db from '../db.js';

const router = express.Router();

// Lista de activos válidos para validación
const CRIPTOS = ['BTC', 'ETH', 'SOL', 'ADA', 'PEPE', 'DOGE', 'SHIB'];
const ACCIONES = ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

// Precios mock iniciales para cuando las APIs externas fallen o den límite
const mockPricesState = {
  BTC: 65000.0,
  ETH: 3500.0,
  SOL: 150.0,
  ADA: 0.45,
  PEPE: 0.000012,
  DOGE: 0.14,
  SHIB: 0.000022,
  AAPL: 180.0,
  NVDA: 120.0,
  TSLA: 170.0,
  MSFT: 420.0
};

// Obtener un precio mock 100% determinista basado en el activo y la fecha de hoy
function getDeterministicMockPrice(symbol) {
  const basePrice = mockPricesState[symbol] || 100.0;
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // Semilla única para el activo y el día de hoy
  const seed = hashCode(`${symbol}_${dateStr}`);
  
  // Variación determinista del día de hoy (+/- 4%)
  const change = (seededRandom(seed) - 0.49) * 0.08;
  const decimals = ['PEPE', 'SHIB'].includes(symbol) ? 8 : 2;
  return parseFloat((basePrice * (1 + change)).toFixed(decimals));
}

// Utilidad para mapear símbolos de criptos a Binance USDT
function getBinanceSymbol(symbol) {
  // Ajuste especial para PEPE, SHIB u otras monedas si es necesario
  return `${symbol}USDT`;
}

// Función para generar un hash entero simple a partir de un string
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Generador pseudo-aleatorio basado en una semilla (sin estado para ser determinista)
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Función generadora de velas de respaldo (mock) para acciones en caso de error de Yahoo Finance o fuera de horario
function generateMockCandles(symbol, interval = '1d') {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // Generamos un precio final determinista basado en el símbolo y el día
  const endPrice = getDeterministicMockPrice(symbol);
  
  const candles = [];
  let stepMs = 24 * 60 * 60 * 1000; // 1d por defecto
  if (interval === '15m') stepMs = 15 * 60 * 1000;
  else if (interval === '1h') stepMs = 60 * 60 * 1000;

  const currentBucket = Math.floor(today.getTime() / stepMs);
  let price = endPrice;

  // Generamos 60 velas hacia atrás
  for (let i = 0; i < 60; i++) {
    const bucket = currentBucket - i;
    const timestamp = bucket * stepMs;
    
    // Semilla basada en el símbolo, el día y el bucket absoluto
    const seed = hashCode(`${symbol}_${interval}_${bucket}`);
    const change = (seededRandom(seed) - 0.48) * 0.015;
    
    const close = price;
    const open = price / (1 + change);
    
    // Deterministic high/low based on the same seed but shifted
    const high = Math.max(open, close) * (1 + seededRandom(seed + 1) * 0.008);
    const low = Math.min(open, close) * (1 - seededRandom(seed + 2) * 0.008);
    
    const decimals = ['PEPE', 'SHIB'].includes(symbol) ? 8 : 2;
    
    candles.push({
      x: timestamp,
      y: [
        parseFloat(open.toFixed(decimals)),
        parseFloat(high.toFixed(decimals)),
        parseFloat(low.toFixed(decimals)),
        parseFloat(close.toFixed(decimals))
      ]
    });
    
    price = open;
  }
  
  return candles.reverse();
}

// Obtener precio actual instantáneo de un activo
async function getCurrentPrice(symbol, type) {
  // Para asegurar sincronización 100% estable entre temporalidades, siempre usar
  // el precio mock determinista del día tanto para acciones como divisas.
  return getDeterministicMockPrice(symbol);
}

// GET /api/trading/candles - Obtiene datos de velas históricas para los gráficos
router.get('/candles', async (req, res) => {
  const { symbol, type, interval = '1d' } = req.query;

  if (!symbol || !type) {
    return res.status(400).json({ error: 'Faltan parámetros symbol y type' });
  }

  try {
    // Para asegurar determinismo, estabilidad e inmovilidad de precios
    // sin importar la temporalidad elegida, generamos velas mock deterministas
    // tanto para divisas como para acciones.
    const mockCandles = generateMockCandles(symbol, interval);
    res.json(mockCandles);
  } catch (err) {
    console.error(`Error crítico al obtener velas para ${symbol}:`, err.message);
    const mockCandles = generateMockCandles(symbol, interval);
    res.json(mockCandles);
  }
});

// GET /api/trading/portfolio - Obtiene el balance y activos del usuario
router.get('/portfolio', async (req, res) => {
  try {
    // 1. Obtener balance en efectivo
    const profileRes = await db.query('SELECT balance FROM user_profile WHERE id = 1');
    const balance = parseFloat(profileRes.rows[0].balance);

    // 2. Obtener activos del portafolio
    const portfolioRes = await db.query('SELECT asset_symbol, asset_name, asset_type, amount, average_buy_price FROM user_portfolio WHERE amount > 0');
    const holdings = portfolioRes.rows;

    // 3. Actualizar valores con el precio actual en vivo
    const portfolioList = [];
    let totalAssetsValue = 0;

    for (const holding of holdings) {
      const symbol = holding.asset_symbol;
      const type = holding.asset_type;
      const amount = parseFloat(holding.amount);
      const avgPrice = parseFloat(holding.average_buy_price);
      
      let currentPrice = avgPrice;
      try {
        currentPrice = await getCurrentPrice(symbol, type);
      } catch (e) {
        console.warn(`No se pudo obtener precio en vivo para ${symbol}, usando precio promedio.`);
      }

      const currentValue = amount * currentPrice;
      const costBasis = amount * avgPrice;
      const profitLossVal = currentValue - costBasis;
      const profitLossPct = costBasis > 0 ? (profitLossVal / costBasis) * 100 : 0;

      totalAssetsValue += currentValue;

      portfolioList.push({
        symbol,
        name: holding.asset_name,
        type,
        amount,
        averageBuyPrice: avgPrice,
        currentPrice,
        currentValue,
        profitLossVal,
        profitLossPct
      });
    }

    res.json({
      cashBalance: balance,
      totalAssetsValue,
      totalPortfolioValue: balance + totalAssetsValue,
      assets: portfolioList
    });
  } catch (err) {
    console.error('Error al obtener portafolio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trading/order - Ejecuta una orden de compra o venta ficticia
router.post('/order', async (req, res) => {
  const { symbol, name, type, action, amount } = req.body;

  if (!symbol || !name || !type || !action || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos o cantidad inválida' });
  }

  if (action !== 'BUY' && action !== 'SELL') {
    return res.status(400).json({ error: 'Acción inválida. Debe ser BUY o SELL' });
  }

  // Validar si es un activo permitido
  const isCrypto = type === 'crypto' && CRIPTOS.includes(symbol);
  const isStock = type === 'stock' && ACCIONES.includes(symbol);

  if (!isCrypto && !isStock) {
    return res.status(400).json({ error: `Activo '${symbol}' (${type}) no disponible para simulación` });
  }

  try {
    // 1. Obtener precio actual
    const currentPrice = await getCurrentPrice(symbol, type);
    const totalCost = parseFloat(amount) * currentPrice;

    // 2. Ejecutar transacción en Postgres
    await db.query('BEGIN');

    // Obtener balance del usuario
    const profileRes = await db.query('SELECT balance FROM user_profile WHERE id = 1 FOR UPDATE');
    const balance = parseFloat(profileRes.rows[0].balance);

    if (action === 'BUY') {
      if (balance < totalCost) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: `Saldo insuficiente. Requiere $${totalCost.toFixed(2)} USDT, tiene $${balance.toFixed(2)} USDT.` });
      }

      // Restar saldo
      await db.query('UPDATE user_profile SET balance = balance - $1 WHERE id = 1', [totalCost]);

      // Obtener posesión actual en portafolio
      const portRes = await db.query('SELECT amount, average_buy_price FROM user_portfolio WHERE asset_symbol = $1 FOR UPDATE', [symbol]);
      
      if (portRes.rowCount > 0) {
        const oldAmount = parseFloat(portRes.rows[0].amount);
        const oldAvg = parseFloat(portRes.rows[0].average_buy_price);
        
        const newAmount = oldAmount + parseFloat(amount);
        // Calcular precio promedio ponderado: ((cant_old * precio_old) + (cant_new * precio_new)) / cant_total
        const newAvg = ((oldAmount * oldAvg) + (parseFloat(amount) * currentPrice)) / newAmount;

        await db.query(
          'UPDATE user_portfolio SET amount = $1, average_buy_price = $2, updated_at = CURRENT_TIMESTAMP WHERE asset_symbol = $3',
          [newAmount, newAvg, symbol]
        );
      } else {
        await db.query(
          'INSERT INTO user_portfolio (asset_symbol, asset_name, asset_type, amount, average_buy_price) VALUES ($1, $2, $3, $4, $5)',
          [symbol, name, type, amount, currentPrice]
        );
      }
    } else {
      // Acción SELL
      const portRes = await db.query('SELECT amount, average_buy_price FROM user_portfolio WHERE asset_symbol = $1 FOR UPDATE', [symbol]);
      
      if (portRes.rowCount === 0 || parseFloat(portRes.rows[0].amount) < parseFloat(amount)) {
        await db.query('ROLLBACK');
        const hasAmount = portRes.rowCount > 0 ? parseFloat(portRes.rows[0].amount) : 0;
        return res.status(400).json({ error: `Activo insuficiente. Intenta vender ${amount} ${symbol}, posee ${hasAmount} ${symbol}.` });
      }

      const oldAmount = parseFloat(portRes.rows[0].amount);
      const newAmount = oldAmount - parseFloat(amount);
      const avgPrice = parseFloat(portRes.rows[0].average_buy_price);

      // Sumar saldo
      await db.query('UPDATE user_profile SET balance = balance + $1 WHERE id = 1', [totalCost]);

      if (newAmount === 0) {
        // Eliminar del portafolio o poner en 0
        await db.query('UPDATE user_portfolio SET amount = 0, average_buy_price = 0, updated_at = CURRENT_TIMESTAMP WHERE asset_symbol = $1', [symbol]);
      } else {
        await db.query(
          'UPDATE user_portfolio SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE asset_symbol = $2',
          [newAmount, symbol]
        );
      }
    }

    // 3. Guardar historial
    await db.query(
      `INSERT INTO trading_history (asset_symbol, asset_name, asset_type, transaction_type, amount, price, total_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [symbol, name, type, action, amount, currentPrice, totalCost]
    );

    await db.query('COMMIT');

    // Retornar estado actualizado
    const finalBalanceRes = await db.query('SELECT balance FROM user_profile WHERE id = 1');
    const finalPortfolioRes = await db.query('SELECT asset_symbol, amount, average_buy_price FROM user_portfolio WHERE asset_symbol = $1', [symbol]);
    
    res.json({
      message: `Orden de ${action === 'BUY' ? 'compra' : 'venta'} ejecutada con éxito.`,
      executedPrice: currentPrice,
      totalCost,
      newCashBalance: parseFloat(finalBalanceRes.rows[0].balance),
      newAssetAmount: finalPortfolioRes.rowCount > 0 ? parseFloat(finalPortfolioRes.rows[0].amount) : 0
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al ejecutar transacción de trading:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trading/history - Obtiene el historial de órdenes
router.get('/history', async (req, res) => {
  try {
    const result = await db.query('SELECT id, asset_symbol, asset_name, asset_type, transaction_type, amount, price, total_value, executed_at FROM trading_history ORDER BY executed_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
