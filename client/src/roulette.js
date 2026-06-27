// Módulo del Juego de la Ruleta y Globo Terráqueo 3D con Repetición Espaciada
import * as THREE from 'three';

const RULETA_COUNTRIES = [
  { code: 'PER', name: 'Perú', color: '#ff2a5f' },
  { code: 'JPN', name: 'Japón', color: '#00e5ff' },
  { code: 'DEU', name: 'Alemania', color: '#a855f7' },
  { code: 'EGY', name: 'Egipto', color: '#ffb900' },
  { code: 'BRA', name: 'Brasil', color: '#39ff14' },
  { code: 'USA', name: 'Estados Unidos', color: '#ff7675' },
  { code: 'FRA', name: 'Francia', color: '#74b9ff' },
  { code: 'IND', name: 'India', color: '#ff76ff' },
  { code: 'ZAF', name: 'Sudáfrica', color: '#00cec9' },
  { code: 'AUS', name: 'Australia', color: '#fdcb6e' }
];

const GLOBE_COUNTRIES = [
  { code: 'PER', name: 'Perú', lat: -9.19, lon: -75.01, color: '#ff2a5f' },
  { code: 'JPN', name: 'Japón', lat: 36.20, lon: 138.25, color: '#00e5ff' },
  { code: 'DEU', name: 'Alemania', lat: 51.16, lon: 10.45, color: '#a855f7' },
  { code: 'EGY', name: 'Egipto', lat: 26.82, lon: 30.80, color: '#ffb900' },
  { code: 'BRA', name: 'Brasil', lat: -14.23, lon: -51.92, color: '#39ff14' },
  { code: 'USA', name: 'Estados Unidos', lat: 37.09, lon: -95.71, color: '#ff7675' },
  { code: 'FRA', name: 'Francia', lat: 46.22, lon: 2.21, color: '#74b9ff' },
  { code: 'IND', name: 'India', lat: 20.59, lon: 78.96, color: '#ff76ff' },
  { code: 'ZAF', name: 'Sudáfrica', lat: -30.56, lon: 22.93, color: '#00cec9' },
  { code: 'AUS', name: 'Australia', lat: -25.27, lon: 133.77, color: '#fdcb6e' }
];

let currentAngle = 0;
let isSpinning = false;
let pendingCards = [];
let currentCardIndex = 0;
const API_URL = 'http://localhost:3000/api/learning';

// Estados del Globo 3D
let rotLon = 0.5; // rotación longitudinal
let rotLat = 0.2; // rotación latitudinal
let isDraggingGlobe = false;
let startX, startY;
let activeCountryCode = 'PER';
let activeCategory = 'Comida';
let fetchedQuizData = null;
let passportCachedData = [];

// 1. RULETA CULTURAL
export function initRoulette(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 10;
  const numSlices = RULETA_COUNTRIES.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  function drawWheel(angleOffset) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle + angleOffset;
      const endAngle = startAngle + sliceAngle;
      const country = RULETA_COUNTRIES[i];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.fillStyle = country.color + '22';
      ctx.fill();

      ctx.strokeStyle = country.color + '66';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(country.name, radius - 20, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#0c0d16';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
  }

  drawWheel(0);

  window.spinRoulette = function(onSpinComplete) {
    if (isSpinning) return;
    isSpinning = true;

    let velocity = Math.random() * 0.3 + 0.3;
    const friction = 0.985;
    const minVelocity = 0.001;

    function animate() {
      if (velocity < minVelocity) {
        isSpinning = false;
        const pointerAngle = (3 * Math.PI) / 2;
        const normalizedAngle = (pointerAngle - currentAngle) % (2 * Math.PI);
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
        
        const winningIndex = Math.floor(positiveAngle / sliceAngle) % numSlices;
        const winner = RULETA_COUNTRIES[winningIndex];

        if (onSpinComplete) {
          onSpinComplete(winner);
        }
        return;
      }

      currentAngle += velocity;
      velocity *= friction;
      drawWheel(currentAngle);
      requestAnimationFrame(animate);
    }

    animate();
  };
}

export async function spinAndDiscover(canvas, onComplete) {
  if (isSpinning) return;
  window.spinRoulette(async (winner) => {
    try {
      const response = await fetch(`${API_URL}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: winner.code })
      });
      const data = await response.json();
      if (onComplete) onComplete(data);
    } catch (err) {
      console.error('Error al registrar descubrimiento en la ruleta:', err);
    }
  });
}

// 2. GLOBO TERRÁQUEO 3D REALISTA (THREE.JS / WEBGL) CON TEXTURA SATELITAL E ILUMINACIÓN ESPACIAL
let globeRenderer = null;
let globeScene = null;
let globeCamera = null;
let globeEarthMesh = null;
let globeCountryMarkers = [];
let isGlobeActiveTab = false;

export function setGlobeActive(active) {
  isGlobeActiveTab = active;
  if (active && globeRenderer && globeScene && globeCamera) {
    globeRenderer.render(globeScene, globeCamera);
  }
}

export function resizeGlobeRenderer(width, height) {
  if (globeRenderer && globeCamera) {
    globeCamera.aspect = width / height;
    globeCamera.updateProjectionMatrix();
    globeRenderer.setSize(width, height);
    if (globeScene) {
      globeRenderer.render(globeScene, globeCamera);
    }
  }
}

function renderGlobeFrame() {
  if (isGlobeActiveTab && globeRenderer && globeScene && globeCamera) {
    globeRenderer.render(globeScene, globeCamera);
  }
}

// Escuchador de visibilidad del sistema operativo/navegador
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isGlobeActiveTab) {
    renderGlobeFrame();
  }
});

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function createTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(12, 18, 38, 0.85)';
  if (ctx.roundRect) {
    ctx.roundRect(8, 8, 240, 48, 10);
  } else {
    ctx.fillRect(8, 8, 240, 48);
  }
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.65, 0.16, 1);
  return sprite;
}

export function initGlobe3D(canvas) {
  const width = canvas.width || 280;
  const height = canvas.height || 280;

  // 1. Inicializar Escena, Cámara y Renderer WebGL de Three.js
  globeScene = new THREE.Scene();
  globeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  globeCamera.position.z = 5.2;

  globeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  globeRenderer.setSize(width, height);
  globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 3. Iluminación Espacial (Sombreado Dinámico - Luz Sol del Espacio)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.25); // Luz suave ambiental en el lado oscuro
  globeScene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
  sunLight.position.set(6, 4, 5); // Luz solar direccional simulando el Sol en una esquina
  globeScene.add(sunLight);

  // 2. Textura Fotográfica Optimizada de Satélite (NASA / Blue Marble 2K lightweight)
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load(
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg',
    () => { renderGlobeFrame(); }
  );

  // Esfera 3D de la Tierra
  const earthGeo = new THREE.SphereGeometry(2, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.7,
    metalness: 0.1
  });
  globeEarthMesh = new THREE.Mesh(earthGeo, earthMat);
  globeScene.add(globeEarthMesh);

  // Atmósfera exterior azulada sutil
  const atmosGeo = new THREE.SphereGeometry(2.025, 32, 32);
  const atmosMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  globeScene.add(atmosMesh);

  // Crear Nodos 3D y Etiquetas de Países en la Esfera
  globeCountryMarkers = [];
  GLOBE_COUNTRIES.forEach(country => {
    const markerGroup = new THREE.Group();
    const pos = latLonToVector3(country.lat, country.lon, 2.015);
    markerGroup.position.copy(pos);

    // Pin 3D brillante
    const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: country.color });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.userData = { countryCode: country.code, countryName: country.name };
    markerGroup.add(pinMesh);
    globeCountryMarkers.push(pinMesh);

    // Etiqueta flotante 3D
    const sprite = createTextSprite(country.name, country.color);
    sprite.position.copy(pos.clone().multiplyScalar(0.08));
    markerGroup.add(sprite);

    globeEarthMesh.add(markerGroup);
  });

  // 4. Optimización de Rendimiento (Cero Lag): Renderizado Bajo Demanda (SOLO al interactuar)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const startDrag = (clientX, clientY) => {
    isDraggingGlobe = true;
    startX = clientX;
    startY = clientY;
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingGlobe || !globeEarthMesh) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    startX = clientX;
    startY = clientY;

    globeEarthMesh.rotation.y += dx * 0.008;
    globeEarthMesh.rotation.x += dy * 0.008;

    const maxRotX = Math.PI / 2.5;
    if (globeEarthMesh.rotation.x > maxRotX) globeEarthMesh.rotation.x = maxRotX;
    if (globeEarthMesh.rotation.x < -maxRotX) globeEarthMesh.rotation.x = -maxRotX;

    renderGlobeFrame(); // Renderizar SOLO mientras se arrastra
  };

  const endDrag = () => {
    isDraggingGlobe = false;
  };

  const checkPointerHover = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((clientY - rect.top) / rect.height) * 2 - 1);

    raycaster.setFromCamera(mouse, globeCamera);
    const intersects = raycaster.intersectObjects(globeCountryMarkers);
    
    if (intersects.length > 0) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = isDraggingGlobe ? 'grabbing' : 'grab';
    }
  };

  canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
  canvas.addEventListener('mousemove', e => {
    if (isDraggingGlobe) {
      moveDrag(e.clientX, e.clientY);
    } else {
      checkPointerHover(e.clientX, e.clientY);
    }
  });
  window.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', endDrag);

  // Click Raycasting para abrir Modal del País
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    raycaster.setFromCamera(mouse, globeCamera);
    const intersects = raycaster.intersectObjects(globeCountryMarkers);

    if (intersects.length > 0) {
      const clickedCode = intersects[0].object.userData.countryCode;
      openGlobeCountryModal(clickedCode);
    }
  });

  // Renderizar fotograma inicial cuando la pestaña es activa
  isGlobeActiveTab = !document.getElementById('globe-view-container')?.classList.contains('hidden');
  renderGlobeFrame();
}

// 3. MODAL DE CURIOSIDADES Y QUIZ DEL GLOBO
export async function openGlobeCountryModal(countryCode) {
  activeCountryCode = countryCode;
  activeCategory = 'Comida'; // categoría inicial por defecto

  // Registrar descubrimiento del país al hacerle click
  try {
    await fetch(`${API_URL}/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode })
    });
  } catch (e) {
    console.error('Error al registrar descubrimiento en modal:', e);
  }

  // Refrescar datos en el modal y desplegar
  await updateGlobeModalDetails();
  
  const modal = document.getElementById('globe-country-modal');
  if (modal) modal.classList.remove('hidden');
}

async function updateGlobeModalDetails() {
  const nameEl = document.getElementById('g-modal-country-name');
  const factsList = document.getElementById('g-facts-list');
  const levelBadge = document.getElementById('g-stamp-medal-name');
  const progressText = document.getElementById('g-stamp-progress-text');
  const progressFill = document.getElementById('g-stamp-progress-fill');
  const quizSection = document.getElementById('g-quiz-section');
  const detailsPanel = document.getElementById('g-category-details-panel');

  if (!nameEl || !factsList || !levelBadge) return;

  // 1. Mostrar paneles correctos (ocultar quiz al iniciar)
  quizSection.classList.add('hidden');
  detailsPanel.classList.remove('hidden');

  // 2. Cargar datos del pasaporte acumulados para saber el progreso del nivel
  await loadPassportDataOnly();

  const countryPassport = passportCachedData.find(c => c.country_code === activeCountryCode) || {};
  let columnName = 'comida_nivel';
  if (activeCategory === 'Comida') columnName = 'comida_nivel';
  else if (activeCategory === 'Naturaleza') columnName = 'naturaleza_nivel';
  else if (activeCategory === 'Economía') columnName = 'economia_nivel';
  else if (activeCategory === 'Costumbres') columnName = 'costumbres_nivel';
  else if (activeCategory === 'Geografía') columnName = 'geografia_nivel';

  const currentLevel = countryPassport[columnName] || 0; // 0, 1, 2, 3

  // 3. Renderizar textos de progreso de sello
  const pct = (currentLevel / 3) * 100;
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${currentLevel}/3 Completado`;

  const medals = ['Sin Sello', 'Sello de Bronce 🥉', 'Sello de Plata 🥈', 'Sello de Oro 🥇 (Dominado)'];
  levelBadge.innerHTML = `<strong class="txt-cyan">${medals[currentLevel]}</strong>`;

  // 4. Consumir los datos interesantes de la API
  try {
    factsList.innerHTML = '<li>Cargando curiosidades...</li>';
    const res = await fetch(`${API_URL}/facts?country=${activeCountryCode}&category=${activeCategory}`);
    const data = await res.json();
    fetchedQuizData = data;

    nameEl.textContent = `${data.countryName} — ${activeCategory}`;
    
    // Renderizar datos interesantes
    factsList.innerHTML = '';
    data.facts.forEach(fact => {
      const li = document.createElement('li');
      li.textContent = fact;
      factsList.appendChild(li);
    });

  } catch (err) {
    console.error('Error al cargar facts de categoría:', err);
    factsList.innerHTML = '<li>Error al cargar la información del país.</li>';
  }
}

async function loadPassportDataOnly() {
  try {
    const res = await fetch(`${API_URL}/passport`);
    passportCachedData = await res.json();
  } catch (e) {
    console.warn('Error al cargar pasaporte para modal:', e);
  }
}

// Inicializador de listeners para el modal del Globo
export function initGlobeModalEvents() {
  const modal = document.getElementById('globe-country-modal');
  const btnClose = document.getElementById('btn-close-globe-modal');
  const catButtons = document.querySelectorAll('.globe-category-tabs button');
  const btnStartQuiz = document.getElementById('btn-start-globe-quiz');
  const btnBackToFacts = document.getElementById('btn-back-to-facts');
  const btnSubmitQuiz = document.getElementById('btn-submit-globe-quiz');
  
  const quizSection = document.getElementById('g-quiz-section');
  const detailsPanel = document.getElementById('g-category-details-panel');

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  }

  // Cambio de categorías dentro del modal
  catButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-cat');
      await updateGlobeModalDetails();
    });
  });

  // Abrir mini-quiz
  if (btnStartQuiz) {
    btnStartQuiz.addEventListener('click', () => {
      if (!fetchedQuizData || !fetchedQuizData.quiz) return;
      detailsPanel.classList.add('hidden');
      quizSection.classList.remove('hidden');

      // Dibujar las 3 preguntas
      const container = document.getElementById('g-quiz-questions-container');
      container.innerHTML = '';

      fetchedQuizData.quiz.forEach((q, qIdx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'quiz-q-group';
        
        const optionsHTML = q.options.map((opt, optIdx) => `
          <label class="quiz-option-label">
            <input type="radio" name="g-quiz-q${qIdx}" value="${optIdx}">
            <span>${opt}</span>
          </label>
        `).join('');

        qDiv.innerHTML = `
          <p class="quiz-question-title"><strong>P${qIdx+1}:</strong> ${q.question}</p>
          <div class="quiz-options-grid">${optionsHTML}</div>
        `;
        container.appendChild(qDiv);
      });
    });
  }

  // Volver del quiz a los facts
  if (btnBackToFacts) {
    btnBackToFacts.addEventListener('click', () => {
      quizSection.classList.add('hidden');
      detailsPanel.classList.remove('hidden');
    });
  }

  // Enviar respuestas del quiz
  if (btnSubmitQuiz) {
    btnSubmitQuiz.addEventListener('click', async () => {
      const selectedAnswers = [];
      for (let i = 0; i < 3; i++) {
        const checked = document.querySelector(`input[name="g-quiz-q${i}"]:checked`);
        if (!checked) {
          alert('Por favor responde las 3 preguntas del mini-quiz.');
          return;
        }
        selectedAnswers.push(parseInt(checked.value));
      }

      try {
        const response = await fetch(`${API_URL}/quiz-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryCode: activeCountryCode,
            category: activeCategory,
            answers: selectedAnswers
          })
        });
        const result = await response.json();

        if (result.success) {
          alert(`🎉 ¡Excelente! Respondiste correctamente las 3 preguntas del quiz de ${activeCategory}.\nSello de ${activeCategory} subió de nivel.`);
          await updateGlobeModalDetails(); // recarga el progreso en el modal
          await loadPassport(); // refresca los sellos en el pasaporte visual inferior
        } else {
          // Destacar preguntas incorrectas
          alert('⚠️ Respuestas incorrectas detectadas. Por favor vuelve a leer el tema e inténtalo de nuevo.');
          result.results.forEach(res => {
            const qTitle = document.querySelector(`#g-quiz-questions-container .quiz-q-group:nth-child(${res.questionIdx+1}) .quiz-question-title`);
            if (qTitle) {
              qTitle.style.color = res.correct ? 'var(--green-neon)' : 'var(--red-neon)';
            }
          });
        }
      } catch (err) {
        console.error('Error al enviar respuestas del quiz:', err);
      }
    });
  }
}

// 4. APARTADO DE REPASO DE TARJETAS (SPACED REPETITION)
export async function loadPendingCards() {
  try {
    const res = await fetch(`${API_URL}/cards`);
    pendingCards = await res.json();
    updatePendingBadge();
    return pendingCards;
  } catch (err) {
    console.error('Error al obtener tarjetas pendientes:', err);
  }
}

function updatePendingBadge() {
  const badge = document.getElementById('cards-pending-count');
  const btnStart = document.getElementById('btn-start-reviews');
  if (badge) badge.textContent = `${pendingCards.length} Pendientes`;
  if (btnStart) {
    btnStart.textContent = `Iniciar Repaso (${pendingCards.length})`;
    btnStart.disabled = pendingCards.length === 0;
  }
}

export function startReviews() {
  if (pendingCards.length === 0) return;
  currentCardIndex = 0;
  showCard(pendingCards[currentCardIndex]);
}

function showCard(card) {
  const initBox = document.getElementById('fc-state-init');
  const questionBox = document.getElementById('fc-state-question');
  const answerBox = document.getElementById('fc-state-answer');

  initBox.classList.add('hidden');
  answerBox.classList.add('hidden');
  questionBox.classList.remove('hidden');

  const cleanQuestion = card.question.replace(/^\[(Comida|Naturaleza|Economía|Costumbres|Geografía)\]\s*/, '');
  const categoryMatch = card.question.match(/^\[(Comida|Naturaleza|Economía|Costumbres|Geografía)\]/);
  const category = categoryMatch ? categoryMatch[1] : 'Comida';

  document.getElementById('fc-country-name').textContent = `${card.country_name} — Sello: ${category}`;
  document.getElementById('fc-question').textContent = cleanQuestion;

  const revealBtn = document.getElementById('btn-reveal-answer');
  revealBtn.onclick = () => {
    questionBox.classList.add('hidden');
    answerBox.classList.remove('hidden');

    document.getElementById('fc-country-name-ans').textContent = `${card.country_name} — Sello: ${category}`;
    document.getElementById('fc-question-dup').textContent = cleanQuestion;
    document.getElementById('fc-answer').textContent = card.answer;

    const gradeButtons = document.querySelectorAll('.grade-buttons button');
    gradeButtons.forEach(btn => {
      btn.onclick = async () => {
        const grade = parseInt(btn.getAttribute('data-grade'));
        await submitReview(card.id, grade);
      };
    });
  };
}

async function submitReview(cardId, grade) {
  try {
    const response = await fetch(`${API_URL}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, grade })
    });
    await response.json();
    currentCardIndex++;
    if (currentCardIndex < pendingCards.length) {
      showCard(pendingCards[currentCardIndex]);
    } else {
      await loadPendingCards();
      resetFlashcardState();
      await loadPassport();
    }
  } catch (err) {
    console.error('Error al subir el repaso de tarjeta:', err);
  }
}

function resetFlashcardState() {
  const initBox = document.getElementById('fc-state-init');
  const questionBox = document.getElementById('fc-state-question');
  const answerBox = document.getElementById('fc-state-answer');
  questionBox.classList.add('hidden');
  answerBox.classList.add('hidden');
  initBox.classList.remove('hidden');
}

// 5. RENDERIZACIÓN DEL PASAPORTE DE SELLOS MULTI-NIVEL
export async function loadPassport() {
  const container = document.getElementById('passport-stamps-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/passport`);
    const stampsData = await res.json();

    container.innerHTML = '';

    if (stampsData.length === 0) {
      container.innerHTML = `<div class="loading-placeholder" style="grid-column: 1/-1;">No tienes países descubiertos aún. ¡Gira la ruleta o explora el globo arriba para sellar tu primer viaje!</div>`;
      return;
    }

    let fullyMasteredCount = 0;

    stampsData.forEach(country => {
      const stampCard = document.createElement('div');
      
      const categoryStamps = [
        { name: 'Comida', level: country.comida_nivel || 0, icon: '🍳', desc: 'Comida' },
        { name: 'Naturaleza', level: country.naturaleza_nivel || 0, icon: '🌿', desc: 'Naturaleza' },
        { name: 'Economía', level: country.economia_nivel || 0, icon: '💼', desc: 'Economía' },
        { name: 'Costumbres', level: country.costumbres_nivel || 0, icon: '🎭', desc: 'Costumbres' },
        { name: 'Geografía', level: country.geografia_nivel || 0, icon: '🗺️', desc: 'Geografía' }
      ];

      // Verificar si este país tiene todas las categorías dominadas (nivel 3)
      const isDominado = categoryStamps.every(cat => cat.level === 3);
      if (isDominado) {
        fullyMasteredCount++;
      }

      stampCard.className = `stamp-box unlocked ${isDominado ? 'dominado-glow' : ''}`;

      const stampsHTML = categoryStamps.map(cat => {
        const medalNames = ['Pendiente', 'Bronce 🥉', 'Plata 🥈', 'Oro 🥇'];
        const levelClass = `lvl-${cat.level}`; // lvl-0, lvl-1, lvl-2, lvl-3
        return `
          <div class="stamp-badge ${levelClass}" 
               data-cat="${cat.name}" 
               data-tooltip="${cat.desc}: ${medalNames[cat.level]} (${cat.level}/3)">
            ${cat.icon}
          </div>
        `;
      }).join('');

      stampCard.innerHTML = `
        <h3>📍 ${country.country_name} ${isDominado ? '<span class="master-crown" title="¡Totalmente Dominado!">👑</span>' : ''}</h3>
        <div class="stamps-badge-row">
          ${stampsHTML}
        </div>
      `;

      container.appendChild(stampCard);
    });

    // Validar si los 10 países del globo están completamente dominados (oro en todo)
    // El catálogo tiene 10 países
    if (fullyMasteredCount >= 10) {
      showAllMasteredBanner(true);
    } else {
      showAllMasteredBanner(false);
    }

  } catch (err) {
    console.error('Error al cargar pasaporte de sellos:', err);
    container.innerHTML = `<div class="loading-placeholder" style="grid-column: 1/-1;">Error al conectar con la base de datos de sellos.</div>`;
  }
}

function showAllMasteredBanner(visible) {
  let banner = document.getElementById('all-countries-mastered-banner');
  if (visible) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'all-countries-mastered-banner';
      banner.className = 'glowing-success-banner card-style-c cyan';
      banner.innerHTML = `
        <div class="banner-icon">🎖️</div>
        <div class="banner-body">
          <h3>¡Logro Supremo: Gran Geógrafo del Observatorio!</h3>
          <p>Has dominado por completo los 10 países del catálogo con nivel Oro en todas las áreas de aprendizaje. ¿Deseas seguir expandiendo tus horizontes? Solicita al Agente Antigravity añadir nuevos países (como España, China, Italia o México) para agregarlos dinámicamente a tu base de datos y continuar aprendiendo.</p>
        </div>
      `;
      // Insertar antes del grid de pasaportes
      const passportSection = document.querySelector('.passport-section');
      if (passportSection) {
        passportSection.insertBefore(banner, document.getElementById('passport-stamps-container'));
      }
    }
  } else {
    if (banner) banner.remove();
  }
}
