// Módulo de Cálculo Matemático de Astronomía y Fase Lunar para Piura, Perú
// Latitud: -5.1945° S | Longitud: -80.6328° W

// Referencia astronómica para Luna Nueva: 11 de Enero de 2024 a las 11:57 UTC
const BASE_NEW_MOON = new Date('2024-01-11T11:57:00Z');
const SYNODIC_MONTH = 29.530588853; // Duración media del ciclo lunar en días

// Cuerpos Celestes y Constelaciones definidos con coordenadas esféricas base (Ascensión Recta/Declinación aproximadas)
// Para simplificar y hacerlo interactivo localmente, recalculamos su Altitud y Azimut en base al tiempo sideral simulado.
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
    connections: [[0, 2], [1, 3]], // Líneas del crucero
    ra: 12.5, // Ascensión Recta aproximada en horas
    dec: -60  // Declinación aproximada (muy al Sur, visible en Piura)
  },
  {
    name: 'Orión',
    stars: [
      { name: 'Betelgeuse', x: -10, y: 15 },
      { name: 'Rigel', x: 10, y: -15 },
      { name: 'Bellatrix', x: -12, y: 8 },
      { name: 'Saiph', x: 8, y: -18 },
      { name: 'Alnitak', x: -2, y: -2 }, // Cinturón (Las Tres Marías)
      { name: 'Alnilam', x: 0, y: -1 },
      { name: 'Mintaka', x: 2, y: 0 }
    ],
    connections: [[0, 2], [2, 6], [6, 5], [5, 4], [4, 1], [1, 3], [3, 0]], // Silueta
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
  
  // Iluminación aproximada (0% en Nueva, 100% en Llena)
  // Se calcula usando el coseno del ángulo de fase
  const angle = phasePercent * 2 * Math.PI;
  const illumination = Math.round(((1 - Math.cos(angle)) / 2) * 100);

  let phaseName = '';
  if (phasePercent < 0.03 || phasePercent >= 0.97) {
    phaseName = 'Luna Nueva';
  } else if (phasePercent >= 0.03 && phasePercent < 0.22) {
    phaseName = 'Creciente Cóncava';
  } else if (phasePercent >= 0.22 && phasePercent < 0.28) {
    phaseName = 'Cuarto Creciente';
  } else if (phasePercent >= 0.28 && phasePercent < 0.47) {
    phaseName = 'Gíbea Creciente';
  } else if (phasePercent >= 0.47 && phasePercent < 0.53) {
    phaseName = 'Luna Llena';
  } else if (phasePercent >= 0.53 && phasePercent < 0.72) {
    phaseName = 'Gíbea Menguante';
  } else if (phasePercent >= 0.72 && phasePercent < 0.78) {
    phaseName = 'Cuarto Menguante';
  } else {
    phaseName = 'Creciente Menguante';
  }

  // Días restantes para el siguiente ciclo completo (Luna Nueva)
  const daysToNext = (SYNODIC_MONTH - normalizedAge).toFixed(1);

  return {
    phasePercent,
    illumination,
    phaseName,
    daysToNext
  };
}

// Actualiza el renderizado visual de la luna esférica en el DOM
export function updateMoonVisual(moonData) {
  const shadowOverlay = document.getElementById('moon-shadow-overlay');
  const moonRender = document.getElementById('moon-render');
  const phaseNameEl = document.getElementById('moon-phase-name');
  const illuminationEl = document.getElementById('moon-illumination');
  const cycleDaysEl = document.getElementById('moon-cycle-days');

  if (!shadowOverlay || !phaseNameEl || !illuminationEl || !cycleDaysEl) return;

  phaseNameEl.textContent = moonData.phaseName;
  illuminationEl.textContent = moonData.illumination;
  cycleDaysEl.textContent = moonData.daysToNext;

  const pct = moonData.phasePercent;

  // Renderizar la sombra utilizando box-shadow o clip-path
  // Si pct es 0.5 (Luna Llena), no hay sombra.
  // Si pct es 0 o 1, sombra completa.
  if (pct >= 0 && pct < 0.5) {
    // Fase Creciente: la sombra se mueve de derecha a izquierda revelando la luz
    const shadowWidth = (1 - (pct * 2)) * 100;
    shadowOverlay.style.left = 'auto';
    shadowOverlay.style.right = '0';
    shadowOverlay.style.width = `${shadowWidth}%`;
    shadowOverlay.style.borderRadius = shadowWidth > 50 ? '50% 0 0 50%' : '0';
  } else {
    // Fase Menguante: la sombra empieza a cubrir de derecha a izquierda
    const shadowWidth = ((pct - 0.5) * 2) * 100;
    shadowOverlay.style.right = 'auto';
    shadowOverlay.style.left = '0';
    shadowOverlay.style.width = `${shadowWidth}%`;
    shadowOverlay.style.borderRadius = shadowWidth > 50 ? '0 50% 50% 0' : '0';
  }
}

// 2. CÁLCULO DE COORDENADAS PARA PIURA
// Calcula Altitud (elevación sobre horizonte: -90 a 90) y Azimut (compás: 0 a 360) para los astros
export function calculateCelestialPositions(date = new Date()) {
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  
  // Posición del Sol (Aproximación matemática simplificada para Piura)
  // El Sol sale al Este (Az: 90) a las 06:00, Cenit a las 12:00 (Alt: 85° en Piura por cercanía al ecuador), se pone al Oeste (Az: 270) a las 18:00
  let sunAz = 0;
  let sunAlt = 0;
  
  if (hours >= 6 && hours <= 18) {
    const sunProgress = (hours - 6) / 12; // 0 a 1
    sunAz = 90 + sunProgress * 180; // 90 (E) -> 180 (S) -> 270 (W)
    sunAlt = Math.sin(sunProgress * Math.PI) * 85; // Máxima elevación de 85 grados
  } else {
    // De noche está bajo el horizonte
    const nightProgress = hours < 6 ? (hours + 6) / 12 : (hours - 18) / 12;
    sunAz = (270 + nightProgress * 180) % 360;
    sunAlt = -Math.sin(nightProgress * Math.PI) * 85;
  }

  // Posición de la Luna
  // La posición de la Luna depende fuertemente de la fase lunar (se retrasa unos 50 minutos cada día)
  const moonPhaseData = calculateMoonPhase(date);
  const moonDelayHours = moonPhaseData.phasePercent * 24;
  const moonRiseTime = (6 + moonDelayHours) % 24;
  const moonSetTime = (moonRiseTime + 12) % 24;
  
  let moonAz = 0;
  let moonAlt = -10; // bajo el horizonte por defecto
  
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
    moonAlt = Math.sin(moonProgress * Math.PI) * 78; // Elevación máxima 78°
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

  // Posiciones de Planetas y Constelaciones en base a la rotación de la Tierra (Hora del día)
  // Las estrellas giran alrededor de los polos. En Piura (Hemisferio Sur bajo, latitud -5°) el Polo Sur Celeste está casi en el horizonte Sur.
  const timeAngle = (hours / 24) * 2 * Math.PI; // Rotación terrestre

  // Júpiter
  positions.jupiter = {
    az: (120 + Math.sin(timeAngle) * 80 + 360) % 360,
    alt: Math.cos(timeAngle) * 60 + 10
  };

  // Venus
  positions.venus = {
    az: (60 + Math.cos(timeAngle) * 90 + 360) % 360,
    alt: Math.sin(timeAngle) * 50 + 5
  };

  // Marte
  positions.mars = {
    az: (210 + Math.sin(timeAngle) * 70 + 360) % 360,
    alt: Math.cos(timeAngle + 1.2) * 55 + 15
  };

  // Constelaciones
  const constellationPositions = CONSTELLATIONS.map(constel => {
    // Desplazamiento aproximado por tiempo sideral
    const starRotation = timeAngle + (constel.ra / 24) * 2 * Math.PI;
    
    // Alt/Az del centro de la constelación
    // La Cruz del Sur está muy al sur (Dec -60), rota cerca del polo sur (Azimut 180)
    let centerAz = 180;
    let centerAlt = 15; // baja altura
    
    if (constel.name === 'Cruz del Sur') {
      centerAz = (180 + Math.sin(starRotation) * 35 + 360) % 360;
      centerAlt = 20 + Math.cos(starRotation) * 15;
    } else { // Orión
      // Orión está en el ecuador celeste, cruza de este a oeste
      centerAz = (90 + (hours / 24) * 180 + 90) % 360;
      centerAlt = Math.sin((hours / 24) * Math.PI) * 75;
    }

    return {
      name: constel.name,
      centerAz,
      centerAlt,
      stars: constel.stars.map(star => {
        // Coordenadas locales proyectadas alrededor del centro
        return {
          name: star.name,
          // Escalamiento de posiciones en pixeles en el mapa polar
          relX: star.x,
          relY: star.y
        };
      }),
      connections: constel.connections
    };
  });

  return {
    astros: positions,
    constellations: constellationPositions
  };
}

// 3. RENDERIZADO DEL DOMO CELESTE CANVAS
export function drawSkyDome(canvas, userAz, userAlt, date = new Date()) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 15;

  // Limpiar Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Dibujar el fondo estrellado circular del domo
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#030408';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Dibujar líneas de referencia (Círculos concéntricos de Altitud y ejes de Azimut)
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.66, 0, 2 * Math.PI); // Altitud 30°
  ctx.arc(cx, cy, radius * 0.33, 0, 2 * Math.PI); // Altitud 60°
  ctx.stroke();

  // Ejes Cardinales
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); // N - S
  ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); // W - E
  ctx.stroke();

  // Etiquetas Cardinales
  ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - radius - 6);
  ctx.fillText('S', cx, cy + radius + 6);
  ctx.fillText('E', cx + radius + 6, cy);
  ctx.fillText('O', cx - radius - 6, cy);

  // 3. Calcular posiciones reales de los astros para Piura
  const positions = calculateCelestialPositions(date);

  // 4. Dibujar Constelaciones
  positions.constellations.forEach(constel => {
    // Solo dibujar si está sobre el horizonte
    if (constel.centerAlt > 0) {
      // Proyección polar del centro de la constelación
      const angle = (constel.centerAz - 90) * (Math.PI / 180);
      const dist = ((90 - constel.centerAlt) / 90) * radius;
      
      const ccx = cx + dist * Math.cos(angle);
      const ccy = cy + dist * Math.sin(angle);

      // Calcular posiciones absolutas de cada estrella en el canvas
      const starCoords = constel.stars.map(star => {
        return {
          x: ccx + star.relX,
          y: ccy + star.relY,
          name: star.name
        };
      });

      // Dibujar líneas de conexión de la constelación
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 1;
      constel.connections.forEach(conn => {
        const s1 = starCoords[conn[0]];
        const s2 = starCoords[conn[1]];
        ctx.beginPath();
        ctx.moveTo(s1.x, s2.y); // Usar coordenadas de estrella
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      });

      // Dibujar estrellas individuales
      starCoords.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1.8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Nombre de la constelación
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '9px sans-serif';
      ctx.fillText(constel.name, ccx, ccy + 25);
    }
  });

  // 5. Dibujar astros principales (Sol, Luna, Planetas)
  const isNight = date.getHours() < 6 || date.getHours() > 18;

  ASTROS.forEach(astro => {
    const pos = positions.astros[astro.id] || { az: 0, alt: -10 };
    
    // Solo dibujar si está sobre el horizonte
    if (pos.alt > 0) {
      if (astro.isDayOnly && isNight) return; // ocultar sol de noche

      const angle = (pos.az - 90) * (Math.PI / 180);
      const dist = ((90 - pos.alt) / 90) * radius;
      
      const ax = cx + dist * Math.cos(angle);
      const ay = cy + dist * Math.sin(angle);

      // Dibujar cuerpo celeste
      ctx.beginPath();
      ctx.arc(ax, ay, astro.size / 2, 0, 2 * Math.PI);
      ctx.fillStyle = astro.color;
      ctx.shadowColor = astro.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Etiqueta del astro
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText(astro.name, ax, ay - astro.size - 2);
    }
  });

  // 6. Dibujar la Retícula/Mira del Usuario (Lente de orientación)
  // Proyectar dónde está apuntando el usuario
  const userAngle = (userAz - 90) * (Math.PI / 180);
  const userDist = ((90 - userAlt) / 90) * radius;

  const ux = cx + userDist * Math.cos(userAngle);
  const uy = cy + userDist * Math.sin(userAngle);

  // Retícula
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ux, uy, 18, 0, 2 * Math.PI); // círculo de mira
  ctx.stroke();

  // Cruz interna de la mira
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ux - 5, uy); ctx.lineTo(ux + 5, uy);
  ctx.moveTo(ux, uy - 5); ctx.lineTo(ux, uy + 5);
  ctx.stroke();

  // 7. Evaluar si la mira está apuntando a un astro (colisión en coordenadas Alt/Az)
  // Devolvemos recomendaciones basadas en lo que está en mira
  const recommendationsList = [];
  const targetThreshold = 10; // grados de cercanía

  // Revisar planetas y sol/luna
  ASTROS.forEach(astro => {
    const pos = positions.astros[astro.id];
    if (pos && pos.alt > 0) {
      if (astro.isDayOnly && isNight) return;
      
      const distAz = Math.abs(pos.az - userAz);
      const distAlt = Math.abs(pos.alt - userAlt);

      if (distAz < targetThreshold && distAlt < targetThreshold) {
        recommendationsList.push({
          type: 'targeting',
          text: `👉 <strong>Apuntando a ${astro.name}:</strong> Elevación ${pos.alt.toFixed(1)}°, Dirección ${pos.az.toFixed(1)}°.`
        });
      } else {
        recommendationsList.push({
          type: 'visible',
          text: `✨ ${astro.name} visible a ${pos.alt.toFixed(0)}° Alt, ${pos.az.toFixed(0)}° Az.`
        });
      }
    }
  });

  // Revisar constelaciones
  positions.constellations.forEach(constel => {
    if (constel.centerAlt > 0) {
      const distAz = Math.abs(constel.centerAz - userAz);
      const distAlt = Math.abs(constel.centerAlt - userAlt);

      if (distAz < 12 && distAlt < 12) {
        recommendationsList.push({
          type: 'targeting',
          text: `👉 <strong>Apuntando a la Constelación ${constel.name}:</strong> Centrada a ${constel.centerAlt.toFixed(0)}° Alt.`
        });
      } else {
        recommendationsList.push({
          type: 'visible',
          text: `✨ Constelación ${constel.name} visible al ${constel.centerAz > 135 && constel.centerAz < 225 ? 'Sur' : 'Este/Oeste'}.`
        });
      }
    }
  });

  return recommendationsList;
}
