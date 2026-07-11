// Módulo de Simulación de Trading y Gráficos Financieros
import ApexCharts from 'apexcharts';

const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '192.168.1.5';
const API_URL = `http://${host}:3000/api/trading`;

let activeAsset = {
  symbol: 'BTC',
  name: 'Bitcoin',
  type: 'crypto',
  price: 0
};
let activeOrderAction = 'BUY'; // 'BUY' o 'SELL'
let activeInterval = '1d'; // '15m' | '1h' | '1d'
let chartInstance = null;

// 1. OBTENER VELAS HISTÓRICAS Y DIBUJAR GRÁFICO
export async function loadCandlesChart() {
  const chartContainer = document.getElementById('financial-candles-chart');
  const loader = document.getElementById('chart-loader');
  if (!chartContainer) return;

  if (loader) {
    loader.textContent = 'Cargando velas financieras...';
    loader.classList.remove('hidden');
  }

  try {
    const res = await fetch(`${API_URL}/candles?symbol=${activeAsset.symbol}&type=${activeAsset.type}&interval=${activeInterval}`);
    if (!res.ok) {
      throw new Error(`Servidor respondió con código ${res.status}`);
    }
    const candlesData = await res.json();
    if (!Array.isArray(candlesData)) {
      throw new Error(candlesData?.error || 'Los datos de velas no son válidos.');
    }

    if (loader) loader.classList.add('hidden');

    // Si ya existe un gráfico previo, destruirlo antes de crear uno nuevo
    if (chartInstance) {
      chartInstance.destroy();
    }

    const isDesktop = window.innerWidth >= 768;

    const options = {
      series: [{
        data: candlesData
      }],
      chart: {
        type: 'candlestick',
        height: 400,
        width: '100%',
        background: 'transparent',
        animations: {
          enabled: isDesktop, // ACTIVA LA ANIMACIÓN SOLO EN LAPTOP PARA SUAVIZAR LOS TROMPICONES
          easing: 'easeinout',
          speed: 150, // Velocidad ultra rápida para que responda al instante pero con fluidez líquida
          animateGradually: {
            enabled: false // Desactiva el dibujado paso a paso que causa retrasos
          },
          dynamicAnimation: {
            enabled: isDesktop, // Suaviza el cambio de los ejes cuando la rueda gira
            speed: 150
          }
        },
        zoom: {
          enabled: false
        },
        selection: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        foreColor: '#64748b',
        events: {
          beforeMounted: (chartContext, config) => {
            console.log("Chart listo para scroll");
          }
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.03)',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false, // Utilizar zona horaria local (importante para 15m/1h)
          style: {
            colors: '#64748b',
            fontFamily: 'Plus Jakarta Sans'
          }
        }
      },
      yaxis: {
        show: isDesktop,
        opposite: false,
        forceNiceScale: true,
        tooltip: {
          enabled: false
        },
        labels: {
          show: true,
          formatter: function (val) {
            if (val === null || val === undefined || isNaN(val)) return '';
            const absVal = Math.abs(val);
            if (absVal >= 1e12) return '$' + (val / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
            if (absVal >= 1e9) return '$' + (val / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
            if (absVal >= 1e6) return '$' + (val / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
            if (absVal >= 1e3) return '$' + (val / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
            if (absVal < 0.01 && absVal > 0) return '$' + val.toFixed(6);
            return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          },
          style: {
            colors: '#64748b',
            fontFamily: 'Plus Jakarta Sans'
          }
        }
      },
      plotOptions: {
        candlestick: {
          columnWidth: '65%',
          colors: {
            upward: '#39ff14',   // Alza: Verde neón
            downward: '#ff3366'  // Baja: Rojo coral
          },
          wick: {
            useFillColor: true
          }
        }
      },
      tooltip: {
        enabled: false
      }
    };

    const currentTimeframe = activeInterval.toUpperCase();
    if (currentTimeframe === '1D') {
      options.xaxis.labels.datetimeUTC = true;
      options.xaxis.tickPlacement = 'on';
    }

    chartInstance = new ApexCharts(chartContainer, options);
    await chartInstance.render();

    // Renderizar barra estática lateral de precios para la vista móvil aislada
    renderMobilePricesSidebar(candlesData);

    // Desplazar el contenedor con scroll nativo hacia el extremo derecho solo en móviles
    if (!isDesktop && candlesData.length > 25) {
      const wrapper = chartContainer.closest('.chart-container-wrapper') || chartContainer.parentElement;
      if (wrapper) {
        wrapper.scrollLeft = wrapper.scrollWidth;
      }
    }

    // Actualizar precio de cabecera con el último precio de cierre
    if (candlesData.length > 0) {
      const lastCandle = candlesData[candlesData.length - 1];
      const lastPrice = lastCandle.y[3]; // close
      activeAsset.price = lastPrice;
      updateHeaderPrice(lastPrice);
    }
  } catch (err) {
    console.error('Error al cargar datos del gráfico financiero:', err);
    if (loader) {
      loader.innerHTML = `<span class="txt-red">⚠️ Datos temporales de mercado no disponibles (Yahoo Finance límite). Usando simulación local.</span>`;
      loader.classList.remove('hidden');
    }
  }
}


function updateHeaderPrice(price) {
  const priceEl = document.getElementById('active-asset-price');
  const orderPriceEl = document.getElementById('order-price-display');
  
  const formattedPrice = '$' + price.toLocaleString('en-US', { 
    minimumFractionDigits: activeAsset.symbol === 'PEPE' || activeAsset.symbol === 'SHIB' ? 6 : 2, 
    maximumFractionDigits: activeAsset.symbol === 'PEPE' || activeAsset.symbol === 'SHIB' ? 6 : 2 
  });

  if (priceEl) priceEl.textContent = formattedPrice;
  if (orderPriceEl) orderPriceEl.textContent = formattedPrice;
  
  updateOrderTotalCost();
}

// 2. ACTUALIZAR PORTAFOLIO Y TRANSACCIONES EN EL DOM
export async function loadPortfolio() {
  try {
    const res = await fetch(`${API_URL}/portfolio`);
    const data = await res.json();

    // Actualizar paneles superiores de balances
    document.getElementById('trading-cash-balance').textContent = '$' + data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('trading-assets-value').textContent = '$' + data.totalAssetsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('trading-total-value').textContent = '$' + data.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Renderizar tabla de posesiones ( holdings )
    const holdingsTable = document.getElementById('portfolio-holdings-table');
    if (holdingsTable) {
      holdingsTable.innerHTML = '';
      
      if (data.assets.length === 0) {
        holdingsTable.innerHTML = `<tr><td colspan="7" class="empty-table-text">No tienes activos comprados en tu portafolio aún.</td></tr>`;
      } else {
        data.assets.forEach(asset => {
          const row = document.createElement('tr');
          const isPositive = asset.profitLossVal >= 0;
          const perfClass = isPositive ? 'txt-green' : 'txt-red';
          const sign = isPositive ? '+' : '';

          row.innerHTML = `
            <td><strong>${asset.symbol}</strong></td>
            <td>${asset.name}</td>
            <td>${parseFloat(asset.amount)}</td>
            <td>$${asset.averageBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>$${asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>$${asset.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td class="${perfClass}">${sign}$${asset.profitLossVal.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${sign}${asset.profitLossPct.toFixed(2)}%)</td>
          `;
          holdingsTable.appendChild(row);
        });
      }
    }

    // Cargar historial de órdenes
    await loadOrderHistory();
  } catch (err) {
    console.error('Error al cargar portafolio:', err);
  }
}

async function loadOrderHistory() {
  const historyTable = document.getElementById('trading-history-table');
  if (!historyTable) return;

  try {
    const res = await fetch(`${API_URL}/history`);
    const history = await res.json();

    historyTable.innerHTML = '';

    if (history.length === 0) {
      historyTable.innerHTML = `<tr><td colspan="6" class="empty-table-text">Sin transacciones registradas.</td></tr>`;
    } else {
      history.forEach(order => {
        const row = document.createElement('tr');
        const actionClass = order.transaction_type === 'BUY' ? 'txt-green' : 'txt-red';
        const dateStr = new Date(order.executed_at).toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        row.innerHTML = `
          <td>${dateStr}</td>
          <td class="${actionClass}"><strong>${order.transaction_type === 'BUY' ? 'COMPRA' : 'VENTA'}</strong></td>
          <td>${order.asset_symbol}</td>
          <td>${parseFloat(order.amount)}</td>
          <td>$${parseFloat(order.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td>$${parseFloat(order.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        `;
        historyTable.appendChild(row);
      });
    }
  } catch (err) {
    console.error('Error al cargar historial de transacciones:', err);
  }
}

// 3. CALCULAR COSTE DE LA ORDEN EN TIEMPO REAL
function updateOrderTotalCost() {
  const amountInput = document.getElementById('order-amount');
  const totalCostEl = document.getElementById('order-total-cost');
  if (!amountInput || !totalCostEl) return;

  const amount = parseFloat(amountInput.value) || 0;
  const total = amount * activeAsset.price;
  
  totalCostEl.textContent = '$' + total.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + ' USDT';
}

// 4. EJECUTAR ORDEN (COMPRA / VENTA)
function showTradingFeedback(message, type) {
  const fb = document.getElementById('trading-feedback-msg');
  if (!fb) return;
  if (type === 'hidden') {
    fb.className = 'trading-feedback-msg hidden';
    fb.textContent = '';
  } else {
    fb.textContent = message;
    fb.className = `trading-feedback-msg ${type}`;
  }
}

async function submitOrder() {
  const amountInput = document.getElementById('order-amount');
  if (!amountInput || !amountInput.value || parseFloat(amountInput.value) <= 0) {
    showTradingFeedback('Ingresa una cantidad válida antes de operar.', 'error');
    return;
  }

  const amount = parseFloat(amountInput.value);

  const orderData = {
    symbol: activeAsset.symbol,
    name: activeAsset.name,
    type: activeAsset.type,
    action: activeOrderAction,
    amount
  };

  try {
    const response = await fetch(`${API_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error && (data.error.toLowerCase().includes('saldo insuficiente') || data.error.toLowerCase().includes('insuficiente'))
        ? 'Fondos insuficientes'
        : (data.error || 'Error en la operación');
      showTradingFeedback(errorMsg, 'error');
      return;
    }

    const successMsg = activeOrderAction === 'BUY' ? 'Compra exitosa' : 'Venta exitosa';
    showTradingFeedback(successMsg, 'success');
    amountInput.value = '';
    
    // Recargar datos actualizados
    await loadPortfolio();
    await loadCandlesChart();
  } catch (err) {
    console.error('Error al enviar orden de trading:', err);
    showTradingFeedback('Ocurrió un error al procesar tu orden.', 'error');
  }
}

// 5. INICIALIZAR LISTENERS DEL MÓDULO DE TRADING
export function initTradingEvents() {
  const assetSelect = document.getElementById('select-active-asset');
  const tabBuy = document.getElementById('order-tab-buy');
  const tabSell = document.getElementById('order-tab-sell');
  const btnSubmit = document.getElementById('btn-submit-order');
  const amountInput = document.getElementById('order-amount');

  // Evento al cambiar activo seleccionado
  if (assetSelect) {
    assetSelect.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      
      activeAsset.symbol = e.target.value;
      activeAsset.type = selectedOption.getAttribute('data-type');
      activeAsset.name = selectedOption.getAttribute('data-name');

      // Actualizar cabeceras e interfaz
      document.getElementById('active-asset-name').textContent = activeAsset.name;
      document.getElementById('active-asset-symbol').textContent = activeAsset.symbol;
      document.getElementById('order-asset-display').textContent = `${activeAsset.symbol} - ${activeAsset.name}`;
      
      if (amountInput) amountInput.value = '';
      showTradingFeedback('', 'hidden');

      loadCandlesChart();
    });
  }

  // Toggle de Tabs Compra / Venta
  if (tabBuy && tabSell && btnSubmit) {
    tabBuy.addEventListener('click', () => {
      tabBuy.classList.add('active');
      tabSell.classList.remove('active');
      activeOrderAction = 'BUY';
      btnSubmit.className = 'btn btn-green btn-full-width';
      btnSubmit.textContent = `Colocar Orden de Compra`;
      if (amountInput) amountInput.value = '';
      showTradingFeedback('', 'hidden');
      updateOrderTotalCost();
    });

    tabSell.addEventListener('click', () => {
      tabSell.classList.add('active');
      tabBuy.classList.remove('active');
      activeOrderAction = 'SELL';
      btnSubmit.className = 'btn btn-red btn-full-width';
      btnSubmit.textContent = `Colocar Orden de Venta`;
      if (amountInput) amountInput.value = '';
      showTradingFeedback('', 'hidden');
      updateOrderTotalCost();
    });
  }

  // Evento al cambiar la cantidad
  if (amountInput) {
    amountInput.addEventListener('input', () => {
      showTradingFeedback('', 'hidden');
      updateOrderTotalCost();
    });
  }

  // Enviar orden
  if (btnSubmit) {
    btnSubmit.addEventListener('click', submitOrder);
  }

  // Configurar selectores de intervalo (15m, 1h, 1d)
  const intervalTabs = document.querySelectorAll('.interval-tab');
  intervalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      intervalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeInterval = tab.getAttribute('data-interval');
      loadCandlesChart();
    });
  });
}

function renderMobilePricesSidebar(candlesData) {
  const sidebar = document.getElementById('mobile-fixed-prices-axis');
  if (!sidebar) return;

  const isDesktop = window.innerWidth >= 768;
  if (isDesktop || !candlesData || candlesData.length === 0) {
    sidebar.classList.add('hidden');
    return;
  }

  sidebar.classList.remove('hidden');

  let maxPrice = -Infinity;
  let minPrice = Infinity;

  candlesData.forEach(c => {
    if (Array.isArray(c.y)) {
      const high = c.y[1];
      const low = c.y[2];
      if (high > maxPrice) maxPrice = high;
      if (low < minPrice) minPrice = low;
    }
  });

  if (maxPrice === -Infinity || minPrice === Infinity) return;

  const count = 5;
  const step = (maxPrice - minPrice) / (count - 1);
  let html = '';

  const formatVal = (val) => {
    const absVal = Math.abs(val);
    if (absVal >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
    if (absVal >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
    if (absVal >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    if (absVal < 0.01 && absVal > 0) return '$' + val.toFixed(4);
    return '$' + val.toFixed(2);
  };

  for (let i = 0; i < count; i++) {
    const val = maxPrice - i * step;
    html += `<span>${formatVal(val)}</span>`;
  }

  sidebar.innerHTML = html;
}
