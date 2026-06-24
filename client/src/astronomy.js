// Módulo de Cálculo Matemático de Astronomía y Fase Lunar para Piura, Perú
// Latitud: -5.1945° S | Longitud: -80.6328° W

const BASE_NEW_MOON = new Date('2024-01-11T11:57:00Z');
const SYNODIC_MONTH = 29.530588853; // Ciclo lunar en días

// Detalles e ilustraciones vectoriales de los astros cuando son enfocados
const ASTRO_DETAILS = {
  'sun': {
    name: 'El Sol',
    desc: 'Nuestra estrella madre. En Piura, debido a su latitud ecuatorial, cruza el cenit con una inclinación casi vertical al mediodía.',
    illustration: (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Rayos de sol
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.4)';
      ctx.lineWidth = 2;
      for (let a = 0; a < 360; a += 45) {
        const rad = a * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.45 * Math.cos(rad), cy + r * 0.45 * Math.sin(rad));
        ctx.lineTo(cx + r * 0.65 * Math.cos(rad), cy + r * 0.65 * Math.sin(rad));
        ctx.stroke();
      }
    }
  },
  'moon': {
    name: 'La Luna',
    desc: 'Nuestro único satélite natural. Controla las mareas y presenta fases que cambian a lo largo de un ciclo de 29.5 días.',
    illustration: (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = '#e2dfd2';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Cráteres
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.arc(cx - r*0.1, cy - r*0.1, r*0.08, 0, 2*Math.PI);
      ctx.arc(cx + r*0.15, cy + r*0.08, r*0.06, 0, 2*Math.PI);
      ctx.arc(cx - r*0.05, cy + r*0.15, r*0.05, 0, 2*Math.PI);
      ctx.fill();
    }
  },
  'venus': {
    name: 'Planeta Venus',
    desc: 'El "lucero del alba". Es el objeto natural más brillante del cielo nocturno después de la Luna, cubierto por nubes ácidas reflectantes.',
    illustration: (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = '#e3bb7b';
      ctx.shadowColor = '#ffeaa7';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  'jupiter': {
    name: 'Planeta Júpiter',
    desc: 'El gigante gaseoso. Posee bandas nubosas ciclónicas y es visible en el cielo despejado de Piura como un faro dorado constante.',
    illustration: (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, 2 * Math.PI);
      ctx.fillStyle = '#d4a373';
      ctx.shadowColor = '#d4a373';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Bandas gaseosas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - r*0.4, cy - r*0.1); ctx.lineTo(cx + r*0.4, cy - r*0.1);
      ctx.moveTo(cx - r*0.35, cy + r*0.15); ctx.lineTo(cx + r*0.35, cy + r*0.15);
      ctx.stroke();
    }
  },
  'mars': {
    name: 'Planeta Marte',
    desc: 'El planeta rojo. Presenta un tono rojizo apagado en el cielo debido al óxido de hierro que cubre su superficie desértica.',
    illustration: (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.38, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  'Cruz del Sur': {
    name: 'Constelación Cruz del Sur',
    desc: 'La joya del hemisferio sur celeste. Sirve a marineros de Piura para orientarse hacia el polo sur geográfico.',
    illustration: (ctx, cx, cy, r) => {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r*0.5); ctx.lineTo(cx, cy + r*0.5); // vertical
      ctx.moveTo(cx - r*0.3, cy); ctx.lineTo(cx + r*0.3, cy); // horizontal
      ctx.stroke();
      
      const stars = [
        {x: 0, y: -r*0.5}, {x: -r*0.3, y: 0},
        {x: 0, y: r*0.5}, {x: r*0.3, y: 0}
      ];
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(cx + s.x, cy + s.y, 4, 0, 2*Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }
  },
  'Orión': {
    name: 'Constelación de Orión',
    desc: 'El cazador gigante. Su cinturón ("Las Tres Marías") cruza exactamente el ecuador celeste, visible en Piura casi en el Cenit.',
    illustration: (ctx, cx, cy, r) => {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 1.5;
      
      // Tres Marías en diagonal
      const belt = [
        {x: -r*0.15, y: -r*0.05},
        {x: 0, y: 0},
        {x: r*0.15, y: r*0.05}
      ];
      ctx.beginPath();
      ctx.moveTo(belt[0].x + cx, belt[0].y + cy);
      ctx.lineTo(belt[2].x + cx, belt[2].y + cy);
      ctx.stroke();

      // Betelgeuse y Rigel
      const stars = [
        {x: -r*0.3, y: -r*0.4, color: '#ff7675'}, // Betelgeuse (roja)
        {x: r*0.3, y: r*0.4, color: '#74b9ff'},  // Rigel (azul)
        ...belt
      ];

      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(cx + s.x, cy + s.y, s.color ? 5 : 3, 0, 2*Math.PI);
        ctx.fillStyle = s.color || '#ffffff';
        ctx.shadowColor = s.color || '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }
  }
};

const ASTROS = [
  { id: 'sun', name: 'Sol', type: 'star', color: '#ffcc00', size: 10, isDayOnly: true },
  { id: 'moon', name: 'Luna', type: 'moon', color: '#f4eedb', size: 9 },
  { id: 'jupiter', name: 'Júpiter', type: 'planet', color: '#e0a96d', size: 6, ra: 2.5, dec: 15 },
  { id: 'venus', name: 'Venus', type: 'planet', color: '#ffea7a', size: 7, ra: 18.2, dec: -22 },
  { id: 'mars', name: 'Marte', type: 'planet', color: '#ff5533', size: 5, ra: 8.5, dec: 22 },
];

const CONSTELLATIONS = [
  {
    name: 'Cruz del Sur',
    stars: [
      { name: 'Acrux', x: 0, y: -15 },
      { name: 'Mimosa', x: -10, y: -5 },
      { name: 'Gacrux', x: 0, y: 15 },
      { name: 'Imai', x: 10, y: 0 }
    ],
    connections: [[0, 2], [1, 3]],
    ra: 12.5,
    dec: -60
  },
  {
    name: 'Orión',
    stars: [
      { name: 'Betelgeuse', x: -10, y: 15 },
      { name: 'Rigel', x: 10, y: -15 },
      { name: 'Bellatrix', x: -12, y: 8 },
      { name: 'Saiph', x: 8, y: -18 },
      { name: 'Alnitak', x: -2, y: -2 },
      { name: 'Alnilam', x: 0, y: -1 },
      { name: 'Mintaka', x: 2, y: 0 }
    ],
    connections: [[0, 2], [2, 6], [6, 5], [5, 4], [4, 1], [1, 3], [3, 0]],
    ra: 5.5,
    dec: -5
  }
];

// 1. CÁLCULO DE LA FASE LUNAR
export function calculateMoonPhase(date = new Date()) {
  const diffMs = date.getTime() - BASE_NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const age = diffDays % SYNODIC_MONTH;
  const normalizedAge = age < 0 ? age + SYNODIC_MONTH : age;
  
  const phasePercent = normalizedAge / SYNODIC_MONTH; // 0 a 1
  
  const angle = phasePercent * 2 * Math.PI;
  const illumination = Math.round(((1 - Math.cos(angle)) / 2) * 100);

  let phaseName = '';
  if (phasePercent < 0.03 || phasePercent >= 0.97) phaseName = 'Luna Nueva';
  else if (phasePercent >= 0.03 && phasePercent < 0.22) phaseName = 'Creciente Cóncava';
  else if (phasePercent >= 0.22 && phasePercent < 0.28) phaseName = 'Cuarto Creciente';
  else if (phasePercent >= 0.28 && phasePercent < 0.47) phaseName = 'Gíbea Creciente';
  else if (phasePercent >= 0.47 && phasePercent < 0.53) phaseName = 'Luna Llena';
  else if (phasePercent >= 0.53 && phasePercent < 0.72) phaseName = 'Gíbea Menguante';
  else if (phasePercent >= 0.72 && phasePercent < 0.78) phaseName = 'Cuarto Menguante';
  else phaseName = 'Creciente Menguante';

  const daysToNext = (SYNODIC_MONTH - normalizedAge).toFixed(1);

  return { phasePercent, illumination, phaseName, daysToNext };
}

export function updateMoonVisual(moonData) {
  const shadowOverlay = document.getElementById('moon-shadow-overlay');
  const phaseNameEl = document.getElementById('moon-phase-name');
  const illuminationEl = document.getElementById('moon-illumination');
  const cycleDaysEl = document.getElementById('moon-cycle-days');

  if (!shadowOverlay || !phaseNameEl || !illuminationEl || !cycleDaysEl) return;

  phaseNameEl.textContent = moonData.phaseName;
  illuminationEl.textContent = moonData.illumination;
  cycleDaysEl.textContent = moonData.daysToNext;

  const pct = moonData.phasePercent;

  if (pct >= 0 && pct < 0.5) {
    const shadowWidth = (1 - (pct * 2)) * 100;
    shadowOverlay.style.left = 'auto';
    shadowOverlay.style.right = '0';
    shadowOverlay.style.width = `${shadowWidth}%`;
    shadowOverlay.style.borderRadius = shadowWidth > 50 ? '50% 0 0 50%' : '0';
  } else {
    const shadowWidth = ((pct - 0.5) * 2) * 100;
    shadowOverlay.style.right = 'auto';
    shadowOverlay.style.left = '0';
    shadowOverlay.style.width = `${shadowWidth}%`;
    shadowOverlay.style.borderRadius = shadowWidth > 50 ? '0 50% 50% 0' : '0';
  }
}

// 2. CÁLCULO DE COORDENADAS CELESTIALES PARA PIURA
export function calculateCelestialPositions(date = new Date()) {
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  
  let sunAz = 0;
  let sunAlt = 0;
  
  if (hours >= 6 && hours <= 18) {
    const sunProgress = (hours - 6) / 12;
    sunAz = 90 + sunProgress * 180;
    sunAlt = Math.sin(sunProgress * Math.PI) * 85;
  } else {
    const nightProgress = hours < 6 ? (hours + 6) / 12 : (hours - 18) / 12;
    sunAz = (270 + nightProgress * 180) % 360;
    sunAlt = -Math.sin(nightProgress * Math.PI) * 85;
  }

  const moonPhaseData = calculateMoonPhase(date);
  const moonDelayHours = moonPhaseData.phasePercent * 24;
  const moonRiseTime = (6 + moonDelayHours) % 24;
  const moonSetTime = (moonRiseTime + 12) % 24;
  
  let moonAz = 0;
  let moonAlt = -10;
  
  const isVisible = moonRiseTime < moonSetTime 
    ? (hours >= moonRiseTime && hours <= moonSetTime)
    : (hours >= moonRiseTime || hours <= moonSetTime);
    
  if (isVisible) {
    let moonProgress = 0;
    if (moonRiseTime < moonSetTime) {
      moonProgress = (hours - moonRiseTime) / 12;
    } else {
      const duration = hours >= moonRiseTime ? (hours - moonRiseTime) : (hours + 24 - moonRiseTime);
      moonProgress = duration / 12;
    }
    moonAz = (80 + moonProgress * 200) % 360;
    moonAlt = Math.sin(moonProgress * Math.PI) * 78;
  } else {
    const duration = hours >= moonSetTime ? (hours - moonSetTime) : (hours + 24 - moonSetTime);
    const moonProgress = duration / 12;
    moonAz = (280 + moonProgress * 160) % 360;
    moonAlt = -Math.sin(moonProgress * Math.PI) * 78;
  }

  const positions = {
    sun: { az: sunAz, alt: sunAlt },
    moon: { az: moonAz, alt: moonAlt }
  };

  const timeAngle = (hours / 24) * 2 * Math.PI;

  positions.jupiter = {
    az: (120 + Math.sin(timeAngle) * 80 + 360) % 360,
    alt: Math.cos(timeAngle) * 60 + 10
  };

  positions.venus = {
    az: (60 + Math.cos(timeAngle) * 90 + 360) % 360,
    alt: Math.sin(timeAngle) * 50 + 5
  };

  positions.mars = {
    az: (210 + Math.sin(timeAngle) * 70 + 360) % 360,
    alt: Math.cos(timeAngle + 1.2) * 55 + 15
  };

  const constellationPositions = CONSTELLATIONS.map(constel => {
    const starRotation = timeAngle + (constel.ra / 24) * 2 * Math.PI;
    let centerAz = 180;
    let centerAlt = 15;
    
    if (constel.name === 'Cruz del Sur') {
      centerAz = (180 + Math.sin(starRotation) * 35 + 360) % 360;
      centerAlt = 20 + Math.cos(starRotation) * 15;
    } else {
      centerAz = (90 + (hours / 24) * 180 + 90) % 360;
      centerAlt = Math.sin((hours / 24) * Math.PI) * 75;
    }

    return {
      name: constel.name,
      centerAz,
      centerAlt,
      stars: constel.stars.map(star => ({
        name: star.name,
        relX: star.x,
        relY: star.y
      })),
      connections: constel.connections
    };
  });

  return { astros: positions, constellations: constellationPositions };
}

// 3. RENDERIZADO DEL DOMO CELESTE CANVAS
export function drawSkyDome(canvas, userAz, userAlt, date = new Date()) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 15;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Efecto Fundido a Negro (Fade to Black) según Inclinación/Altitud
  // Si altitud es < 20°, totalmente negro.
  // Entre 20° y 30° se interpola opacidad linealmente.
  // >= 30° opacidad máxima.
  let opacity = 1;
  if (userAlt < 20) {
    opacity = 0;
  } else if (userAlt >= 20 && userAlt < 30) {
    opacity = (userAlt - 20) / 10;
  }

  // Fondo del domo celestial
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#030408';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Guardar el estado para aplicar la opacidad en el cielo
  ctx.save();
  ctx.globalAlpha = opacity;

  // 2. Líneas de referencia concéntricas
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.66, 0, 2 * Math.PI); // Altitud 30°
  ctx.arc(cx, cy, radius * 0.33, 0, 2 * Math.PI); // Altitud 60°
  ctx.stroke();

  // Ejes
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
  ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
  ctx.stroke();

  // Etiquetas
  ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - radius - 6);
  ctx.fillText('S', cx, cy + radius + 6);
  ctx.fillText('E', cx + radius + 6, cy);
  ctx.fillText('O', cx - radius - 6, cy);

  // Calcular posiciones reales de los astros
  const positions = calculateCelestialPositions(date);
  let targetedAstroObj = null;

  // 3. Dibujar Constelaciones
  positions.constellations.forEach(constel => {
    if (constel.centerAlt > 0) {
      const angle = (constel.centerAz - 90) * (Math.PI / 180);
      const dist = ((90 - constel.centerAlt) / 90) * radius;
      
      const ccx = cx + dist * Math.cos(angle);
      const ccy = cy + dist * Math.sin(angle);

      const starCoords = constel.stars.map(star => ({
        x: ccx + star.relX,
        y: ccy + star.relY,
        name: star.name
      }));

      // Dibujar líneas corregidas (líneas rectas)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 1;
      constel.connections.forEach(conn => {
        const s1 = starCoords[conn[0]];
        const s2 = starCoords[conn[1]];
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      });

      // Dibujar estrellas
      starCoords.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '9px sans-serif';
      ctx.fillText(constel.name, ccx, ccy + 22);

      // Comprobación de colisión (mira) para constelación
      const distAz = Math.abs(constel.centerAz - userAz);
      const distAlt = Math.abs(constel.centerAlt - userAlt);
      if (distAz < 12 && distAlt < 12) {
        targetedAstroObj = { id: constel.name, name: constel.name, type: 'constellation' };
      }
    }
  });

  // 4. Dibujar astros
  const isNight = date.getHours() < 6 || date.getHours() > 18;
  ASTROS.forEach(astro => {
    const pos = positions.astros[astro.id] || { az: 0, alt: -10 };
    
    if (pos.alt > 0) {
      if (astro.isDayOnly && isNight) return;

      const angle = (pos.az - 90) * (Math.PI / 180);
      const dist = ((90 - pos.alt) / 90) * radius;
      
      const ax = cx + dist * Math.cos(angle);
      const ay = cy + dist * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(ax, ay, astro.size / 2, 0, 2 * Math.PI);
      ctx.fillStyle = astro.color;
      ctx.shadowColor = astro.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText(astro.name, ax, ay - astro.size - 2);

      // Comprobación de colisión (mira) para astros
      const distAz = Math.abs(pos.az - userAz);
      const distAlt = Math.abs(pos.alt - userAlt);
      if (distAz < 10 && distAlt < 10) {
        targetedAstroObj = { id: astro.id, name: astro.name, type: astro.type };
      }
    }
  });

  // Restaurar estado (opacidad de fundido)
  ctx.restore();

  // 5. Dibujar Retícula en el centro físico de la mira del usuario (siempre visible)
  const userAngle = (userAz - 90) * (Math.PI / 180);
  const userDist = ((90 - userAlt) / 90) * radius;
  const ux = cx + userDist * Math.cos(userAngle);
  const uy = cy + userDist * Math.sin(userAngle);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ux, uy, 16, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ux - 5, uy); ctx.lineTo(ux + 5, uy);
  ctx.moveTo(ux, uy - 5); ctx.lineTo(ux, uy + 5);
  ctx.stroke();

  // 6. Generar lista de cuerpos visibles
  const recList = [];
  const targetThreshold = 10;

  ASTROS.forEach(astro => {
    const pos = positions.astros[astro.id];
    if (pos && pos.alt > 0) {
      if (astro.isDayOnly && isNight) return;
      const isTargeted = targetedAstroObj && targetedAstroObj.id === astro.id;

      if (isTargeted) {
        recList.push({
          type: 'targeting',
          text: `🎯 <strong>Apuntando a ${astro.name}:</strong> Elevación ${pos.alt.toFixed(1)}° | Azimut ${pos.az.toFixed(1)}°.`
        });
      } else {
        recList.push({
          type: 'visible',
          text: `✨ ${astro.name} visible a ${pos.alt.toFixed(0)}° Alt, ${pos.az.toFixed(0)}° Az.`
        });
      }
    }
  });

  positions.constellations.forEach(constel => {
    if (constel.centerAlt > 0) {
      const isTargeted = targetedAstroObj && targetedAstroObj.id === constel.name;

      if (isTargeted) {
        recList.push({
          type: 'targeting',
          text: `🎯 <strong>Apuntando a ${constel.name}:</strong> Centrado a ${constel.centerAlt.toFixed(0)}° Alt.`
        });
      } else {
        recList.push({
          type: 'visible',
          text: `✨ Constelación ${constel.name} visible al ${constel.centerAz > 135 && constel.centerAz < 225 ? 'Sur' : 'Este/Oeste'}.`
        });
      }
    }
  });

  return {
    recommendations: recList,
    targetedAstro: targetedAstroObj,
    opacity
  };
}

// 4. ACTUALIZADOR DE PANEL DE RECOMENDACIÓN / ASTRONÓMICO LATERAL
// Muestra ilustración y descripción del astro apuntado, o la Luna por defecto
export function updateAstronomyPanel(targetedAstro, moonPhaseData) {
  const moonRenderEl = document.getElementById('moon-render');
  const shadowOverlay = document.getElementById('moon-shadow-overlay');
  const phaseNameEl = document.getElementById('moon-phase-name');
  const illuminationEl = document.getElementById('moon-illumination');
  const cycleDaysLabel = document.getElementById('moon-cycle-days');
  const recommendationsBox = document.querySelector('.astronomy-recommendations h4');
  const statsWrapper = document.getElementById('moon-stats-wrapper');
  const astroDescEl = document.getElementById('astro-description');

  if (!moonRenderEl || !phaseNameEl || !illuminationEl || !cycleDaysLabel) return;

  if (targetedAstro && ASTRO_DETAILS[targetedAstro.name || targetedAstro.id]) {
    const detail = ASTRO_DETAILS[targetedAstro.name || targetedAstro.id];
    
    // Cambiar texto
    phaseNameEl.innerHTML = `<span class="txt-cyan">Enfoque: ${detail.name}</span>`;
    
    if (statsWrapper) statsWrapper.classList.add('hidden');
    if (astroDescEl) {
      astroDescEl.textContent = detail.desc;
      astroDescEl.classList.remove('hidden');
    }
    
    if (recommendationsBox) {
      recommendationsBox.textContent = "Apuntando en Piura:";
    }

    // Dibujar ilustración vectorial en un canvas temporal sobre moonRender
    shadowOverlay.style.display = 'none'; // ocultar sombra lunar
    
    // Asegurar que hay un canvas de ilustración
    let illusCanvas = document.getElementById('astro-illustration-canvas');
    if (!illusCanvas) {
      illusCanvas = document.createElement('canvas');
      illusCanvas.id = 'astro-illustration-canvas';
      illusCanvas.width = 80;
      illusCanvas.height = 80;
      illusCanvas.style.position = 'absolute';
      illusCanvas.style.top = '0';
      illusCanvas.style.left = '0';
      illusCanvas.style.width = '100%';
      illusCanvas.style.height = '100%';
      illusCanvas.style.zIndex = '5';
      moonRenderEl.appendChild(illusCanvas);
    }
    illusCanvas.style.display = 'block';

    const ctx = illusCanvas.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);
    detail.illustration(ctx, 40, 40, 35);

  } else {
    // Si no apunta a nada, re-mostrar la Fase Lunar por defecto
    phaseNameEl.textContent = moonPhaseData.phaseName;
    
    if (statsWrapper) statsWrapper.classList.remove('hidden');
    if (astroDescEl) astroDescEl.classList.add('hidden');

    illuminationEl.textContent = moonPhaseData.illumination;
    cycleDaysLabel.textContent = moonPhaseData.daysToNext;

    if (recommendationsBox) {
      recommendationsBox.textContent = "Visibles hoy en Piura:";
    }

    // Quitar canvas de ilustración y volver a mostrar sombra lunar
    shadowOverlay.style.display = 'block';
    const illusCanvas = document.getElementById('astro-illustration-canvas');
    if (illusCanvas) illusCanvas.style.display = 'none';

    updateMoonVisual(moonPhaseData);
  }
}

// 5. EVENTOS DRAG (ARRASTRE DE CÁMARA) PARA LAPTOP Y MÓVIL
export function initSkyDragControls(canvas, onUpdateView) {
  let isDragging = false;
  let startX, startY;

  const handleStart = (clientX, clientY) => {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    canvas.style.cursor = 'grabbing';
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    startX = clientX;
    startY = clientY;

    const azSlider = document.getElementById('control-azimuth');
    const altSlider = document.getElementById('control-altitude');

    if (azSlider && altSlider) {
      // Arrastrar a la izquierda incrementa Azimut, arriba incrementa Altitud
      let newAz = (parseFloat(azSlider.value) - dx * 0.4 + 360) % 360;
      let newAlt = parseFloat(altSlider.value) + dy * 0.3;

      if (newAlt < 0) newAlt = 0;
      if (newAlt > 90) newAlt = 90;

      azSlider.value = Math.round(newAz);
      altSlider.value = Math.round(newAlt);

      onUpdateView();
    }
  };

  const handleEnd = () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  };

  canvas.style.cursor = 'grab';
  canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
  canvas.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  window.addEventListener('touchend', handleEnd);
}
