import express from 'express';
import yahooFinance from 'yahoo-finance2';
import db from '../db.js';

const router = express.Router();

// Lista de activos válidos para validación
const CRIPTOS = ['BTC', 'ETH', 'SOL', 'ADA', 'PEPE', 'DOGE', 'SHIB'];
const ACCIONES = ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

// Utilidad para mapear símbolos de criptos a Binance USDT
function getBinanceSymbol(symbol) {
  // Ajuste especial para PEPE, SHIB u otras monedas si es necesario
  return `${symbol}USDT`;
}

// Función generadora de velas de respaldo (mock) para acciones en caso de error de Yahoo Finance
function generateMockCandles(symbol) {
  const basePrices = {
    AAPL: 180,
    NVDA: 120,
    TSLA: 170,
    MSFT: 420
  };
  const basePrice = basePrices[symbol] || 100;
  const candles = [];
  const today = new Date();
  
  let currentPrice = basePrice;
  for (let i = 60; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Caminata aleatoria con leve tendencia alcista
    const change = (Math.random() - 0.48) * 0.03;
    const open = currentPrice;
    const close = currentPrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);
    
    candles.push({
      x: date.getTime(),
      y: [
        parseFloat(open.toFixed(2)),
        parseFloat(high.toFixed(2)),
        parseFloat(low.toFixed(2)),
        parseFloat(close.toFixed(2))
      ]
    });
    
    currentPrice = close;
  }
  return candles;
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
      try {
        const quote = await yahooFinance.quote(symbol);
        if (!quote || !quote.regularMarketPrice) {
          throw new Error(`Yahoo Finance no devolvió precio para ${symbol}`);
        }
        return quote.regularMarketPrice;
      } catch (yfErr) {
        console.warn(`Yahoo Finance quote falló para ${symbol}, usando precio mock de respaldo:`, yfErr.message);
        const basePrices = { AAPL: 180, NVDA: 120, TSLA: 170, MSFT: 420 };
        const base = basePrices[symbol] || 100;
        return parseFloat((base * (1 + (Math.random() - 0.5) * 0.015)).toFixed(2));
      }
    }
  } catch (err) {
    console.error(`Error al obtener precio actual para ${symbol}:`, err.message);
    throw err;
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
      const bSymbol = getBinanceSymbol(symbol);
      // Intervalos Binance: 1h, 1d, etc.
      const bInterval = interval === '1d' ? '1d' : '1h';
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
    } else {
      // Acciones mediante yahooFinance.historical
      // Para yahooFinance, definimos rango de fecha. Pediremos últimos 60 días.
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 90);

      const period1 = startDate.toISOString().split('T')[0];
      const period2 = today.toISOString().split('T')[0];

      // Intervalo en Yahoo: '1d', '1wk', '1mo'
      const yInterval = '1d';

      try {
        const data = await yahooFinance.historical(symbol, {
          period1,
          period2,
          interval: yInterval
        });

        const candles = data.map(item => ({
          x: new Date(item.date).getTime(),
          y: [
            item.open,
            item.high,
            item.low,
            item.close
          ]
        }));

        res.json(candles);
      } catch (yfErr) {
        console.warn(`Yahoo Finance historical falló para ${symbol}, generando velas de respaldo:`, yfErr.message);
        const mockCandles = generateMockCandles(symbol);
        res.json(mockCandles);
      }
    }
  } catch (err) {
    console.error(`Error al obtener velas para ${symbol}:`, err.message);
    res.status(500).json({ error: err.message });
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
