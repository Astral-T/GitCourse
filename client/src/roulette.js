// Módulo del Juego de la Ruleta y Globo Terráqueo 3D con Repetición Espaciada

const RULETA_COUNTRIES = [
  { code: 'PER', name: 'Perú', color: '#ff2a5f' },
  { code: 'JPN', name: 'Japón', color: '#00e5ff' },
  { code: 'DEU', name: 'Alemania', color: '#a855f7' },
  { code: 'EGY', name: 'Egipto', color: '#ffb900' },
  { code: 'BRA', name: 'Brasil', color: '#39ff14' }
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

// 2. GLOBO TERRÁQUEO 3D HOLOGRÁFICO (CANVAS)
// Proyección 3D Ortográfica a pantalla 2D
function project3D(lat, lon, rotLon, rotLat, radius, cx, cy) {
  const phi = lat * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  
  // Coordenadas cartesianas iniciales
  const x = Math.cos(phi) * Math.sin(theta);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(theta);
  
  // Rotación en eje Y (longitud)
  const cosLon = Math.cos(rotLon);
  const sinLon = Math.sin(rotLon);
  const x1 = x * cosLon - z * sinLon;
  const z1 = x * sinLon + z * cosLon;
  
  // Rotación en eje X (latitud/inclinación)
  const cosLat = Math.cos(rotLat);
  const sinLat = Math.sin(rotLat);
  const y2 = y * cosLat - z1 * sinLat;
  const z2 = y * sinLat + z1 * cosLat;
  
  return {
    x: cx + x1 * radius,
    y: cy - y2 * radius,
    visible: z2 > 0
  };
}

export function drawGlobe3D(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  // Agrandar radio si está en pantalla completa
  const isFullscreen = document.body.classList.contains('globe-fullscreen-active');
  const radius = isFullscreen ? Math.min(canvas.width, canvas.height) * 0.4 : canvas.width * 0.38;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo del globo (esfera de cristal)
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, 'rgba(12, 18, 38, 0.4)');
  grad.addColorStop(0.8, 'rgba(12, 18, 38, 0.85)');
  grad.addColorStop(1, 'rgba(0, 229, 255, 0.15)');
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dibujar líneas de cuadrícula (latitudes)
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 5) {
      const p = project3D(lat, lon, rotLon, rotLat, radius, cx, cy);
      if (p.visible) {
        if (lon === -180) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  // Dibujar líneas de cuadrícula (longitudes)
  for (let lon = -180; lon < 180; lon += 30) {
    ctx.beginPath();
    for (let lat = -80; lat <= 80; lat += 5) {
      const p = project3D(lat, lon, rotLon, rotLat, radius, cx, cy);
      if (p.visible) {
        if (lat === -80) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  // Dibujar puntos brillantes de los países
  const time = Date.now() / 180;
  const projectedDots = [];

  GLOBE_COUNTRIES.forEach(country => {
    const p = project3D(country.lat, country.lon, rotLon, rotLat, radius, cx, cy);
    if (p.visible) {
      projectedDots.push({
        code: country.code,
        name: country.name,
        color: country.color,
        x: p.x,
        y: p.y
      });

      // Anillo pulsante exterior
      const pulseSize = 6 + 4 * Math.sin(time + country.name.charCodeAt(0));
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseSize, 0, 2 * Math.PI);
      ctx.strokeStyle = country.color + '44';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Punto central
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = country.color;
      ctx.shadowColor = country.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Texto de país
      ctx.fillStyle = '#ffffff';
      ctx.font = isFullscreen ? 'bold 12px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(country.name, p.x + 8, p.y + 3);
    }
  });

  return projectedDots;
}

export function initGlobe3D(canvas) {
  let projectedDots = [];
  
  const renderLoop = () => {
    // Rotación lenta automática si no se está arrastrando
    if (!isDraggingGlobe && !document.body.classList.contains('globe-fullscreen-active')) {
      rotLon += 0.002;
    }
    projectedDots = drawGlobe3D(canvas);
    requestAnimationFrame(renderLoop);
  };

  requestAnimationFrame(renderLoop);

  // Arrastre para rotar el globo
  const startDrag = (clientX, clientY) => {
    isDraggingGlobe = true;
    startX = clientX;
    startY = clientY;
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingGlobe) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    startX = clientX;
    startY = clientY;

    // Actualizar ángulos
    rotLon += dx * 0.006;
    rotLat += dy * 0.006;

    // Capping de latitud para no voltear los polos
    const maxLat = Math.PI / 2.5;
    if (rotLat > maxLat) rotLat = maxLat;
    if (rotLat < -maxLat) rotLat = -maxLat;
  };

  const endDrag = () => {
    isDraggingGlobe = false;
  };

  canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
  canvas.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
  window.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', endDrag);

  // Click en el canvas para seleccionar país
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Buscar si el click colisiona con algún dot de país proyectado
    let clickedCountry = null;
    let minDist = 18; // umbral de click de 18px

    projectedDots.forEach(dot => {
      const dist = Math.hypot(dot.x - clickX, dot.y - clickY);
      if (dist < minDist) {
        minDist = dist;
        clickedCountry = dot;
      }
    });

    if (clickedCountry) {
      openGlobeCountryModal(clickedCountry.code);
    }
  });
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
