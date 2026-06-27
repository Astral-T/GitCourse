// Orquestador Principal de la SPA (Cliente)
import './style.css';

import { 
  calculateMoonPhase, 
  updateMoonVisual, 
  drawSkyDome,
  updateAstronomyPanel,
  initSkyDragControls,
  initStellarViewer
} from './astronomy.js';

import { 
  initRoulette, 
  spinAndDiscover, 
  loadPendingCards, 
  startReviews, 
  loadPassport,
  initGlobe3D,
  initGlobeModalEvents,
  setGlobeActive,
  resizeGlobeRenderer
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
let currentTab = 'learning';
let isGyroActive = false;

// 1. CONTROLADOR DE CAMBIO DE PESTAÑAS (TABS)
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      if (target === currentTab) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${target}`).classList.add('active');

      currentTab = target;

      const isGlobeVisible = !document.getElementById('globe-view-container')?.classList.contains('hidden');
      setGlobeActive(currentTab === 'learning' && isGlobeVisible);

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
  const btnFullscreen = document.getElementById('btn-fullscreen-sky');
  const skyCard = document.getElementById('sky-dome-card-container');
  const arControls = document.getElementById('sky-ar-overlay-controls');
  const btnActivateGyro = document.getElementById('btn-activate-gyro');

  if (!skyCanvas || !azimuthSlider || !altitudeSlider) return;

  const moonData = calculateMoonPhase(new Date());

  function updateSky() {
    const az = parseFloat(azimuthSlider.value);
    const alt = parseFloat(altitudeSlider.value);
    
    if (valAzimuth) valAzimuth.textContent = az;
    if (valAltitude) valAltitude.textContent = alt;

    // Calcular, dibujar y obtener recomendaciones + cuerpo enfocado
    const result = drawSkyDome(skyCanvas, az, alt, new Date());

    // Actualizar panel lateral de la Luna / Sol / Constelaciones enfocadas
    updateAstronomyPanel(result.targetedAstro, moonData, new Date());

    // Actualizar lista de astros en pantalla
    if (recommendationsList) {
      recommendationsList.innerHTML = '';
      if (result.recommendations.length === 0) {
        recommendationsList.innerHTML = `<li>No hay cuerpos notables en esta orientación.</li>`;
      } else {
        result.recommendations.forEach(rec => {
          const li = document.createElement('li');
          li.innerHTML = rec.text;
          if (rec.type === 'targeting') {
            li.style.borderColor = 'var(--cyan-neon)';
            li.style.background = 'rgba(0, 229, 255, 0.08)';
            li.style.fontWeight = '600';
          }
          recommendationsList.appendChild(li);
        });
      }
    }
  }

  // Desplazamiento por arrastre (Drag) del Canvas celestial
  initSkyDragControls(skyCanvas, updateSky);

  // Sliders manuales
  azimuthSlider.addEventListener('input', updateSky);
  altitudeSlider.addEventListener('input', updateSky);

  // Inicializar luna
  updateMoonVisual(moonData);
  updateSky();

  // Redimensionado del canvas cuando se pasa a pantalla completa
  const handleResize = () => {
    if (document.body.classList.contains('sky-fullscreen-active')) {
      skyCanvas.width = Math.min(window.innerWidth, window.innerHeight) * 0.85;
      skyCanvas.height = skyCanvas.width;
    } else {
      skyCanvas.width = 360;
      skyCanvas.height = 360;
    }
    updateSky();
  };

  // Fullscreen toggle celeste
  if (btnFullscreen && skyCard) {
    btnFullscreen.addEventListener('click', () => {
      const isFullscreen = document.body.classList.toggle('sky-fullscreen-active');
      btnFullscreen.textContent = isFullscreen ? '✖' : '⛶';
      
      if (isFullscreen) {
        // En móvil mostramos botón de sensores
        if (window.DeviceOrientationEvent && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
          if (arControls) arControls.classList.remove('hidden');
        }
      } else {
        if (arControls) arControls.classList.add('hidden');
        // Quitar escucha de giroscopio si se apaga fullscreen
        if (isGyroActive) {
          window.removeEventListener('deviceorientation', handleDeviceOrientation);
          isGyroActive = false;
        }
      }
      handleResize();
    });
  }

  // Lógica de disponibilidad del Visor Estelar (bloqueado de día)
  const btnStellar = document.getElementById('btn-activate-stellar-viewer');
  const lockText = document.getElementById('stellar-viewer-lock-text');
  const stellarOverlay = document.getElementById('stellar-viewer-overlay');
  const stellarCanvas = document.getElementById('stellar-viewer-canvas');
  const btnCloseStellar = document.getElementById('btn-close-stellar-viewer');
  const hudAzimuth = document.getElementById('stellar-hud-azimuth');
  const hudAltitude = document.getElementById('stellar-hud-altitude');

  window.bypassNightCheck = true; // TEMPORAL: Activado para pruebas del usuario
  window.checkStellarViewer = checkStellarViewerAvailability;

  function checkStellarViewerAvailability() {
    if (!btnStellar) return;
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const isNightTime = window.bypassNightCheck || (hour >= 18.5 || hour < 6.0); // 18:30 a 06:00
    
    if (isNightTime) {
      btnStellar.removeAttribute('disabled');
      btnStellar.style.opacity = '1';
      btnStellar.style.cursor = 'pointer';
      if (lockText) lockText.innerHTML = '';
    } else {
      btnStellar.setAttribute('disabled', 'true');
      btnStellar.style.opacity = '0.4';
      btnStellar.style.cursor = 'not-allowed';
      if (lockText) {
        lockText.innerHTML = `⚠️ Disponible solo en horario nocturno (6:30 PM a 6:00 AM)`;
      }
    }
  }

  checkStellarViewerAvailability();

  // Integración y Eventos del Visor Estelar
  let stellarController = null;
  if (btnStellar && stellarOverlay && stellarCanvas && btnCloseStellar) {
    stellarController = initStellarViewer(stellarCanvas, (az, alt) => {
      if (hudAzimuth) hudAzimuth.textContent = Math.round(az);
      if (hudAltitude) hudAltitude.textContent = Math.round(alt);
    });

    btnStellar.addEventListener('click', () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const isNightTime = window.bypassNightCheck || (hour >= 18.5 || hour < 6.0);
      if (!isNightTime) {
        alert('El Visor Estelar solo está disponible de 6:30 PM a 6:00 AM.');
        return;
      }

      stellarOverlay.classList.remove('hidden');
      const currentAz = parseFloat(azimuthSlider.value);
      const currentAlt = parseFloat(altitudeSlider.value);
      stellarController.start(currentAz, currentAlt);
    });

    btnCloseStellar.addEventListener('click', () => {
      stellarController.stop();
      stellarOverlay.classList.add('hidden');
      
      const finalCoords = stellarController.getCoordinates();
      azimuthSlider.value = Math.round(finalCoords.az);
      altitudeSlider.value = Math.round(finalCoords.alt);
      updateSky();
    });
  }

  window.addEventListener('resize', handleResize);

  // Lógica del giroscopio (AR)
  function handleDeviceOrientation(e) {
    if (!document.body.classList.contains('sky-fullscreen-active')) return;
    if (e.alpha === null || e.beta === null) return;
    
    // alpha: guiñada (compás) [0, 360] -> Dirección Azimut
    // beta: cabeceo [inclinación] -> Altitud
    let deviceAz = Math.round(e.alpha);
    let deviceAlt = 90 - Math.abs(Math.round(e.beta)); // apuntar recto = 0°, arriba = 90°
    
    if (deviceAlt < 0) deviceAlt = 0;
    if (deviceAlt > 90) deviceAlt = 90;

    azimuthSlider.value = deviceAz;
    altitudeSlider.value = deviceAlt;
    updateSky();
  }

  if (btnActivateGyro) {
    btnActivateGyro.addEventListener('click', async () => {
      // Pedir permisos explícitos en iOS
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permissionState = await DeviceOrientationEvent.requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation, true);
            isGyroActive = true;
            if (arControls) arControls.classList.add('hidden'); // ocultar botón una vez concedido
          } else {
            alert('Permiso de sensores denegado.');
          }
        } catch (err) {
          console.error('Error pidiendo permiso de sensores:', err);
        }
      } else {
        // Android u otros navegadores
        window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        isGyroActive = true;
        if (arControls) arControls.classList.add('hidden');
      }
    });
  }
}

// 4. REFRESCO GENERAL DE DATOS DE APRENDIZAJE
async function refreshLearningData() {
  await loadPendingCards();
  await loadPassport();
}

// 5. INICIALIZADOR PRINCIPAL ON-LOAD
async function initApp() {
  console.log('Iniciando Portal de Curiosidad y Simulación (Fase 2)...');

  initTabs();
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
          alert(`🎉 ¡Ruleta Detenida!\nHas descubierto a: ${data.countryName}. Se han generado preguntas de geografía, comida y cultura en tu pasaporte.`);
          refreshLearningData();
        });
      });
    }
  }

  // Inicializar Globo Terráqueo 3D
  const globeCanvas = document.getElementById('globe-3d');
  if (globeCanvas) {
    initGlobe3D(globeCanvas);
    initGlobeModalEvents();

    // Toggle de Modo Ruleta / Globo 3D
    const btnModeRoulette = document.getElementById('btn-mode-roulette');
    const btnModeGlobe = document.getElementById('btn-mode-globe');
    const rouletteView = document.getElementById('roulette-view-container');
    const globeView = document.getElementById('globe-view-container');
    const titleEl = document.getElementById('learning-module-title');

    if (btnModeRoulette && btnModeGlobe && rouletteView && globeView) {
      btnModeRoulette.addEventListener('click', () => {
        btnModeRoulette.classList.add('active');
        btnModeGlobe.classList.remove('active');
        rouletteView.classList.remove('hidden');
        globeView.classList.add('hidden');
        if (titleEl) titleEl.textContent = 'Ruleta de Países';
        setGlobeActive(false);
      });

      btnModeGlobe.addEventListener('click', () => {
        btnModeGlobe.classList.add('active');
        btnModeRoulette.classList.remove('active');
        globeView.classList.remove('hidden');
        rouletteView.classList.add('hidden');
        if (titleEl) titleEl.textContent = 'Globo Terráqueo 3D';
        setGlobeActive(true);
      });
    }

    // Fullscreen del Globo 3D
    const btnFullscreenGlobe = document.getElementById('btn-fullscreen-globe');
    if (btnFullscreenGlobe) {
      btnFullscreenGlobe.addEventListener('click', () => {
        const isFull = document.body.classList.toggle('globe-fullscreen-active');
        btnFullscreenGlobe.textContent = isFull ? '✖' : 'Pantalla Completa ⛶';
        
        let newWidth = 280;
        let newHeight = 280;
        if (isFull) {
          newWidth = Math.min(window.innerWidth, window.innerHeight) * 0.85;
          newHeight = newWidth;
        }
        globeCanvas.width = newWidth;
        globeCanvas.height = newHeight;
        resizeGlobeRenderer(newWidth, newHeight);
      });
    }
  }

  // Inicializar botones de repaso de tarjetas
  const btnStartReviews = document.getElementById('btn-start-reviews');
  if (btnStartReviews) {
    btnStartReviews.addEventListener('click', startReviews);
  }

  // Inicializar eventos de otros módulos
  initNewsEvents();
  initTradingEvents();

  // Comprobar conexión y cargar datos de forma asíncrona
  checkBackendConnection().then(isOnline => {
    if (isOnline) {
      refreshLearningData();
    }
  });

  // Spotlight Glow effect
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

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
