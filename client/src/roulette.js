// Módulo del Juego de la Ruleta y Sistema de Repetición Espaciada

const COUNTRIES = [
  { code: 'PER', name: 'Perú', color: '#ff2a5f' },
  { code: 'JPN', name: 'Japón', color: '#00e5ff' },
  { code: 'DEU', name: 'Alemania', color: '#a855f7' },
  { code: 'EGY', name: 'Egipto', color: '#ffb900' },
  { code: 'BRA', name: 'Brasil', color: '#39ff14' }
];

let currentAngle = 0;
let isSpinning = false;
let pendingCards = [];
let currentCardIndex = 0;
const API_URL = 'http://localhost:3000/api/learning';

// 1. INICIALIZACIÓN DE LA RULETA CULTURAL
export function initRoulette(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 10;
  const numSlices = COUNTRIES.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  function drawWheel(angleOffset) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar los sectores
    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle + angleOffset;
      const endAngle = startAngle + sliceAngle;
      const country = COUNTRIES[i];

      // Relleno del sector con transparencia
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.fillStyle = country.color + '22'; // 13% de opacidad
      ctx.fill();

      // Borde del sector
      ctx.strokeStyle = country.color + '66';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dibujar texto del país rotado en el sector
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      // Desplazar el texto del centro
      ctx.fillText(country.name, radius - 20, 0);
      ctx.restore();
    }

    // Dibujar círculo interior decorativo
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

  // Dibujar estado estático inicial
  drawWheel(0);

  // Función para iniciar el giro
  window.spinRoulette = function(onSpinComplete) {
    if (isSpinning) return;
    isSpinning = true;

    let velocity = Math.random() * 0.3 + 0.3; // Velocidad angular inicial
    const friction = 0.985; // Resistencia física al giro
    const minVelocity = 0.001;

    function animate() {
      if (velocity < minVelocity) {
        isSpinning = false;
        
        // Calcular el país seleccionado
        // El puntero está en la parte superior (ángulo = 270° o -Math.PI / 2)
        // El ángulo de la ruleta gira a favor de las agujas del reloj
        const pointerAngle = (3 * Math.PI) / 2;
        // Ajustamos el ángulo final relativo al puntero fijo
        const normalizedAngle = (pointerAngle - currentAngle) % (2 * Math.PI);
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
        
        const winningIndex = Math.floor(positiveAngle / sliceAngle) % numSlices;
        const winner = COUNTRIES[winningIndex];

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

// 2. DISPARAR EL GIRO Y DISPARAR LA API DE DESCUBRIMIENTO
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
      
      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      console.error('Error al registrar descubrimiento en la ruleta:', err);
    }
  });
}

// 3. APARTADO DE REPASO DE TARJETAS (SPACED REPETITION)
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
  if (badge) {
    badge.textContent = `${pendingCards.length} Pendientes`;
  }
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

  // Rellenar pregunta
  // Remover el indicador de categoría del texto si existe para mostrarlo limpio
  const cleanQuestion = card.question.replace(/^\[(Cultura|Economía|Geografía|Ciencia)\]\s*/, '');
  const categoryMatch = card.question.match(/^\[(Cultura|Economía|Geografía|Ciencia)\]/);
  const category = categoryMatch ? categoryMatch[1] : 'Cultura';

  document.getElementById('fc-country-name').textContent = `${card.country_name} — Sello: ${category}`;
  document.getElementById('fc-question').textContent = cleanQuestion;

  // Preparar la revelación de la respuesta
  const revealBtn = document.getElementById('btn-reveal-answer');
  revealBtn.onclick = () => {
    questionBox.classList.add('hidden');
    answerBox.classList.remove('hidden');

    document.getElementById('fc-country-name-ans').textContent = `${card.country_name} — Sello: ${category}`;
    document.getElementById('fc-question-dup').textContent = cleanQuestion;
    document.getElementById('fc-answer').textContent = card.answer;

    // Asignar listeners a los botones de calificación
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

    // Pasar a la siguiente tarjeta o terminar
    currentCardIndex++;
    if (currentCardIndex < pendingCards.length) {
      showCard(pendingCards[currentCardIndex]);
    } else {
      // Finalizó la ronda de estudio de hoy
      await loadPendingCards();
      resetFlashcardState();
      loadPassport(); // refrescar sellos del pasaporte por si ganó alguno
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

// 4. RENDERIZACIÓN DEL PASAPORTE DE SELLOS
export async function loadPassport() {
  const container = document.getElementById('passport-stamps-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/passport`);
    const stampsData = await res.json();

    container.innerHTML = '';

    if (stampsData.length === 0) {
      container.innerHTML = `<div class="loading-placeholder" style="grid-column: 1/-1;">No tienes países descubiertos aún. ¡Gira la ruleta arriba para sellar tu primer viaje!</div>`;
      return;
    }

    stampsData.forEach(country => {
      const stampCard = document.createElement('div');
      stampCard.className = 'stamp-box unlocked';
      
      const categoryStamps = [
        { name: 'Cultura', earned: country.cultura_aprendida, icon: '🏛️', desc: 'Sello de Cultura' },
        { name: 'Economía', earned: country.economia_aprendida, icon: '🪙', desc: 'Sello de Economía' },
        { name: 'Geografía', earned: country.geografia_aprendida, icon: '🗺️', desc: 'Sello de Geografía' },
        { name: 'Ciencia', earned: country.ciencia_aprendida, icon: '🔬', desc: 'Sello de Ciencia' }
      ];

      const stampsHTML = categoryStamps.map(cat => `
        <div class="stamp-badge ${cat.earned ? 'earned' : ''}" 
             data-cat="${cat.name}" 
             data-tooltip="${cat.desc} - ${cat.earned ? 'Conseguido' : 'Pendiente'}">
          ${cat.icon}
        </div>
      `).join('');

      stampCard.innerHTML = `
        <h3>📍 ${country.country_name}</h3>
        <div class="stamps-badge-row">
          ${stampsHTML}
        </div>
      `;

      container.appendChild(stampCard);
    });
  } catch (err) {
    console.error('Error al cargar pasaporte de sellos:', err);
    container.innerHTML = `<div class="loading-placeholder" style="grid-column: 1/-1;">Error al conectar con la base de datos de sellos.</div>`;
  }
}
