// Módulo de Simulación de Trading y Gráficos Financieros
import ApexCharts from 'apexcharts';

const API_URL = 'http://localhost:3000/api/trading';

let activeAsset = {
  symbol: 'BTC',
  name: 'Bitcoin',
  type: 'crypto',
  price: 0
};
let activeOrderAction = 'BUY'; // 'BUY' o 'SELL'
let chartInstance = null;

// 1. OBTENER VELAS HISTÓRICAS Y DIBUJAR GRÁFICO
export async function loadCandlesChart() {
  const chartContainer = document.getElementById('financial-candles-chart');
  const loader = document.getElementById('chart-loader');
  if (!chartContainer) return;

  if (loader) loader.classList.remove('hidden');

  try {
    const res = await fetch(`${API_URL}/candles?symbol=${activeAsset.symbol}&type=${activeAsset.type}`);
    const candlesData = await res.json();

    if (loader) loader.classList.add('hidden');

    // Si ya existe un gráfico previo, destruirlo antes de crear uno nuevo
    if (chartInstance) {
      chartInstance.destroy();
    }

    const options = {
      series: [{
        data: candlesData
      }],
      chart: {
        type: 'candlestick',
        height: '100%',
        background: 'transparent',
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        foreColor: '#64748b' // color de fuente de ejes
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.03)',
        xaxis: {
          lines: { show: true }
        },
        yaxis: {
          lines: { show: true }
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#64748b',
            fontFamily: 'Plus Jakarta Sans'
          }
        }
      },
      yaxis: {
        tooltip: {
          enabled: true
        },
        labels: {
          formatter: function (val) {
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
        theme: 'dark'
      }
    };

    chartInstance = new ApexCharts(chartContainer, options);
    await chartInstance.render();

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
      loader.textContent = 'Error al cargar velas financieras.';
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
async function submitOrder() {
  const amountInput = document.getElementById('order-amount');
  if (!amountInput || !amountInput.value || parseFloat(amountInput.value) <= 0) {
    alert('Ingresa una cantidad válida antes de operar.');
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
      alert(`Error en la operación: ${data.error}`);
      return;
    }

    alert(`✨ ${data.message}\nPrecio Ejecutado: $${data.executedPrice.toLocaleString('en-US')} | Costo: $${data.totalCost.toFixed(2)} USDT`);
    amountInput.value = '';
    
    // Recargar datos actualizados
    await loadPortfolio();
    await loadCandlesChart();
  } catch (err) {
    console.error('Error al enviar orden de trading:', err);
    alert('Ocurrió un error al procesar tu orden.');
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
      updateOrderTotalCost();
    });

    tabSell.addEventListener('click', () => {
      tabSell.classList.add('active');
      tabBuy.classList.remove('active');
      activeOrderAction = 'SELL';
      btnSubmit.className = 'btn btn-red btn-full-width';
      btnSubmit.textContent = `Colocar Orden de Venta`;
      updateOrderTotalCost();
    });
  }

  // Evento al cambiar la cantidad
  if (amountInput) {
    amountInput.addEventListener('input', updateOrderTotalCost);
  }

  // Enviar orden
  if (btnSubmit) {
    btnSubmit.addEventListener('click', submitOrder);
  }
}
