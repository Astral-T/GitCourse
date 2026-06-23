// Orquestador Principal de la SPA (Cliente)
import './style.css';

import { 
  calculateMoonPhase, 
  updateMoonVisual, 
  drawSkyDome 
} from './astronomy.js';

import { 
  initRoulette, 
  spinAndDiscover, 
  loadPendingCards, 
  startReviews, 
  loadPassport 
} from './roulette.js';

import { 
  loadNews, 
  initNewsEvents 
} from './news.js';

import { 
  loadPortfolio, 
  loadCandlesChart, 
  initTradingEvents 
} from './trading.js';

const BACKEND_URL = 'http://localhost:3000';

// Estado global de la vista
let currentTab = 'learning';

// 1. CONTROLADOR DE CAMBIO DE PESTAÑAS (TABS)
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      if (target === currentTab) return;

      // Actualizar estilo active en los botones
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Alternar secciones en el DOM
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${target}`).classList.add('active');

      currentTab = target;

      // Cargar datos específicos del módulo al activarlo
      if (currentTab === 'learning') {
        refreshLearningData();
      } else if (currentTab === 'news') {
        loadNews();
      } else if (currentTab === 'trading') {
        loadPortfolio();
        loadCandlesChart();
      }
    });
  });
}

// 2. COMPROBACIÓN DE SALUD DEL BACKEND
async function checkBackendConnection() {
  const statusEl = document.getElementById('backend-status');
  const statusTextEl = statusEl ? statusEl.querySelector('.status-text') : null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/status`);
    const data = await res.json();
    
    if (res.ok && data.status === 'OK') {
      if (statusEl) {
        statusEl.className = 'connection-status online';
        if (statusTextEl) statusTextEl.textContent = 'En Línea';
      }
      return true;
    }
  } catch (err) {
    console.warn('Backend inalcanzable. Verifique que el servidor Express esté corriendo.');
    if (statusEl) {
      statusEl.className = 'connection-status offline';
      if (statusTextEl) statusTextEl.textContent = 'Desconectado';
    }
  }
  return false;
}

// 3. SECCIÓN COSMOS: INICIALIZAR Y REDIBUJAR CANVAS ASTRONÓMICO
function initAstronomy() {
  const skyCanvas = document.getElementById('sky-dome');
  const azimuthSlider = document.getElementById('control-azimuth');
  const altitudeSlider = document.getElementById('control-altitude');
  const valAzimuth = document.getElementById('val-azimuth');
  const valAltitude = document.getElementById('val-altitude');
  const recommendationsList = document.getElementById('visible-stars-list');

  if (!skyCanvas || !azimuthSlider || !altitudeSlider) return;

  // Lógica para actualizar canvas y lista de recomendaciones
  function updateSky() {
    const az = parseFloat(azimuthSlider.value);
    const alt = parseFloat(altitudeSlider.value);
    
    if (valAzimuth) valAzimuth.textContent = az;
    if (valAltitude) valAltitude.textContent = alt;

    // Calcular y dibujar
    const recommendations = drawSkyDome(skyCanvas, az, alt, new Date());

    // Actualizar lista de recomendaciones en el DOM
    if (recommendationsList) {
      recommendationsList.innerHTML = '';
      if (recommendations.length === 0) {
        recommendationsList.innerHTML = `<li>No hay cuerpos notables identificados en esta orientación.</li>`;
      } else {
        recommendations.forEach(rec => {
          const li = document.createElement('li');
          li.innerHTML = rec.text;
          if (rec.type === 'targeting') {
            li.style.borderColor = 'var(--cyan-neon)';
            li.style.background = 'rgba(0, 229, 255, 0.05)';
            li.style.fontWeight = '500';
          }
          recommendationsList.appendChild(li);
        });
      }
    }
  }

  // Redibujar al mover sliders (Simulador de brújula/inclinación en Laptop)
  azimuthSlider.addEventListener('input', updateSky);
  altitudeSlider.addEventListener('input', updateSky);

  // Inicializar fase lunar
  const moonData = calculateMoonPhase(new Date());
  updateMoonVisual(moonData);

  // Primer dibujado
  updateSky();

  // Opcional: Soporte para celular en el futuro (Giroscopio/Brújula)
  // Dejamos lista la estructura para el API DeviceOrientation
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      // Solo usar si el usuario está en móvil y la pestaña está activa
      if (currentTab === 'learning' && e.alpha !== null) {
        // alpha: rotación compás (0 a 360)
        // beta: inclinación frente-atrás (-180 a 180). Mapeamos a Altitud.
        let deviceAz = Math.round(e.alpha);
        let deviceAlt = Math.round(Math.abs(e.beta));
        
        // Limitar elevación entre 0 y 90
        if (deviceAlt > 90) deviceAlt = 90;

        // Actualizar sliders para feedback visual
        azimuthSlider.value = deviceAz;
        altitudeSlider.value = deviceAlt;
        
        updateSky();
      }
    }, true);
  }
}

// 4. REFRESCO GENERAL DE DATOS DE APRENDIZAJE
async function refreshLearningData() {
  await loadPendingCards();
  await loadPassport();
}

// 5. INICIALIZADOR PRINCIPAL ON-LOAD
async function initApp() {
  console.log('Iniciando Portal de Curiosidad y Simulación...');

  // Inicializar tabs de navegación
  initTabs();

  // Comprobar conexión con servidor Express
  const isOnline = await checkBackendConnection();

  // Inicializar Astronomía
  initAstronomy();

  // Inicializar la Ruleta
  const rouletteWheel = document.getElementById('roulette-wheel');
  if (rouletteWheel) {
    initRoulette(rouletteWheel);

    const btnSpin = document.getElementById('btn-spin-roulette');
    if (btnSpin) {
      btnSpin.addEventListener('click', () => {
        btnSpin.disabled = true;
        
        spinAndDiscover(rouletteWheel, (data) => {
          btnSpin.disabled = false;
          alert(`🎉 ¡Ruleta Detenida!\nHas descubierto a: ${data.countryName}. Nuevas tarjetas añadidas a tu pasaporte.`);
          refreshLearningData();
        });
      });
    }
  }

  // Inicializar botones de repaso
  const btnStartReviews = document.getElementById('btn-start-reviews');
  if (btnStartReviews) {
    btnStartReviews.addEventListener('click', startReviews);
  }

  // Inicializar eventos de otros módulos
  initNewsEvents();
  initTradingEvents();

  // Cargar datos iniciales del módulo activo (Aprendizaje)
  if (isOnline) {
    refreshLearningData();
  }

  // Inicializar linterna interactiva radial (Spotlight Glow) para tarjetas estáticas iniciales
  const staticCards = document.querySelectorAll('.card-style-c');
  staticCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

window.addEventListener('DOMContentLoaded', initApp);
