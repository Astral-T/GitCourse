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
  try {
    if (type === 'crypto') {
      const bSymbol = getBinanceSymbol(symbol);
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${bSymbol}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Binance error: ${response.status}`);
      const data = await response.json();
      return parseFloat(data.price);
    } else {
      // Para acciones, siempre usar el precio mock determinista del día
      // para asegurar sincronización 100% estable entre temporalidades.
      return getDeterministicMockPrice(symbol);
    }
  } catch (err) {
    console.error(`Error al obtener precio actual para ${symbol}:`, err.message);
    return getDeterministicMockPrice(symbol);
  }
}

// GET /api/trading/candles - Obtiene datos de velas históricas para los gráficos
router.get('/candles', async (req, res) => {
  const { symbol, type, interval = '1d' } = req.query;

  if (!symbol || !type) {
    return res.status(400).json({ error: 'Faltan parámetros symbol y type' });
  }

  try {
    if (type === 'crypto') {
      try {
        const bSymbol = getBinanceSymbol(symbol);
        // Mapear intervalos de Binance: 15m, 1h, 1d
        const bInterval = ['15m', '1h', '1d'].includes(interval) ? interval : '1d';
        const url = `https://api.binance.com/api/v3/klines?symbol=${bSymbol}&interval=${bInterval}&limit=60`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Binance error: ${response.status}`);
        const data = await response.json();
        
        // Formato para ApexCharts Candlestick: { x: timestamp, y: [O, H, L, C] }
        const candles = data.map(kline => ({
          x: parseInt(kline[0]), // open time
          y: [
            parseFloat(kline[1]), // open
            parseFloat(kline[2]), // high
            parseFloat(kline[3]), // low
            parseFloat(kline[4])  // close
          ]
        }));

        res.json(candles);
      } catch (cryptoErr) {
        console.warn(`Binance falló para ${symbol} (${interval}), generando velas de respaldo:`, cryptoErr.message);
        const mockCandles = generateMockCandles(symbol, interval);
        res.json(mockCandles);
      }
    } else {
      // Acciones mediante yahooFinance.chart o historical
      const today = new Date();
      const startDate = new Date();
      
      let daysBack = 90;
      if (interval === '15m') daysBack = 2;
      else if (interval === '1h') daysBack = 7;
      
      startDate.setDate(today.getDate() - daysBack);

      try {
        if (interval === '15m' || interval === '1h') {
          // Utilizar chart para intervalos de intradía
          const result = await yahooFinance.chart(symbol, {
            period1: startDate,
            period2: today,
            interval: interval
          });

          if (!result || !result.quotes || result.quotes.length === 0) {
            throw new Error(`Yahoo Finance chart no devolvió datos para ${symbol}`);
          }

          // Filtrar cotizaciones válidas, parsear float, y ordenar cronológicamente ascendente
          const candles = result.quotes
            .filter(q => q && q.date && q.open !== null && q.high !== null && q.low !== null && q.close !== null && q.open !== undefined && q.high !== undefined && q.low !== undefined && q.close !== undefined)
            .map(q => ({
              x: new Date(q.date).getTime(),
              y: [
                parseFloat(q.open),
                parseFloat(q.high),
                parseFloat(q.low),
                parseFloat(q.close)
              ]
            }))
            .sort((a, b) => a.x - b.x);

          res.json(candles);
        } else {
          // Para diario, usar el método historical convencional
          const data = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: today,
            interval: '1d'
          });

          // Filtrar cotizaciones válidas, parsear float, y ordenar cronológicamente ascendente
          const candles = data
            .filter(item => item && item.date && item.open !== null && item.high !== null && item.low !== null && item.close !== null && item.open !== undefined && item.high !== undefined && item.low !== undefined && item.close !== undefined)
            .map(item => ({
              x: new Date(item.date).getTime(),
              y: [
                parseFloat(item.open),
                parseFloat(item.high),
                parseFloat(item.low),
                parseFloat(item.close)
              ]
            }))
            .sort((a, b) => a.x - b.x);

          res.json(candles);
        }
      } catch (yfErr) {
        console.warn(`Yahoo Finance chart/historical falló para ${symbol} (${interval}), generando velas de respaldo:`, yfErr.message);
        const mockCandles = generateMockCandles(symbol, interval);
        res.json(mockCandles);
      }
    }
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
