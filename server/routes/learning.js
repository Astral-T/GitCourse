import express from 'express';
import db from '../db.js';

const router = express.Router();

// Banco de datos estático de preguntas de países para poblar cuando se descubren
const COUNTRY_FACTS = {
  'PER': {
    name: 'Perú',
    cards: [
      { category: 'Cultura', question: '¿Cuál es el festival inca del sol celebrado en Cusco cada solsticio de invierno?', answer: 'Inti Raymi' },
      { category: 'Economía', question: '¿Cuál es el principal producto mineral de exportación de Perú que lidera en Sudamérica?', answer: 'El Cobre' },
      { category: 'Geografía', question: '¿Qué lago navegable, el más alto del mundo, comparte Perú con Bolivia?', answer: 'El Lago Titicaca' },
      { category: 'Ciencia', question: '¿Qué científico peruano es pionero mundial de la astronáutica y motores a combustible líquido?', answer: 'Pedro Paulet' }
    ]
  },
  'JPN': {
    name: 'Japón',
    cards: [
      { category: 'Cultura', question: '¿Cómo se llama el arte tradicional japonés de doblar papel para crear figuras sin tijeras?', answer: 'Origami' },
      { category: 'Economía', question: '¿Cuál es la moneda de curso legal en Japón y una de las más transaccionadas del trading?', answer: 'El Yen (JPY)' },
      { category: 'Geografía', question: '¿Cuál es el volcán sagrado y pico más alto de Japón, visible desde Tokio?', answer: 'El Monte Fuji' },
      { category: 'Ciencia', question: '¿Qué tren bala de alta velocidad japonés funciona por levitación magnética ultra rápida?', answer: 'Shinkansen (o Maglev)' }
    ]
  },
  'DEU': {
    name: 'Alemania',
    cards: [
      { category: 'Cultura', question: '¿Qué célebre festival folclórico de la cerveza se celebra anualmente en Múnich desde 1810?', answer: 'Oktoberfest' },
      { category: 'Economía', question: '¿Qué empresa de software empresarial alemana es la más grande de Europa y líder en ERP?', answer: 'SAP' },
      { category: 'Geografía', question: '¿Qué importante río europeo nace en la Selva Negra alemana y desemboca en el Mar Negro?', answer: 'El Danubio' },
      { category: 'Ciencia', question: '¿Qué físico alemán formuló la Teoría de la Relatividad General en 1915?', answer: 'Albert Einstein' }
    ]
  },
  'EGY': {
    name: 'Egipto',
    cards: [
      { category: 'Cultura', question: '¿Cómo se llama el sistema de escritura mediante dibujos y símbolos del antiguo Egipto?', answer: 'Jeroglíficos' },
      { category: 'Economía', question: '¿Qué canal artificial en Egipto conecta el Mar Mediterráneo con el Mar Rojo?', answer: 'El Canal de Suez' },
      { category: 'Geografía', question: '¿Qué río atraviesa todo Egipto y fue vital para su antigua civilización?', answer: 'El Río Nilo' },
      { category: 'Ciencia', question: '¿Qué proceso milenario usaban los egipcios para la conservación biológica de cuerpos?', answer: 'Embalsamamiento (o Momificación)' }
    ]
  },
  'BRA': {
    name: 'Brasil',
    cards: [
      { category: 'Cultura', question: '¿Qué gran desfile y fiesta popular paraliza a Río de Janeiro antes de la Cuaresma?', answer: 'El Carnaval de Río' },
      { category: 'Economía', question: '¿Cuál es el principal producto agrícola en el cual Brasil es el mayor productor y exportador mundial?', answer: 'El Café' },
      { category: 'Geografía', question: '¿Qué río, el más caudaloso y largo del mundo, fluye a través de la selva brasileña?', answer: 'El Río Amazonas' },
      { category: 'Ciencia', question: '¿Qué inventor brasileño es considerado en su país como el pionero de la aviación por volar el 14-bis?', answer: 'Alberto Santos Dumont' }
    ]
  }
};

// GET /api/learning/passport - Obtiene el estado del pasaporte y los sellos acumulados
router.get('/passport', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT country_code, country_name, first_visit, cultura_aprendida, economia_aprendida, ciencia_aprendida, geografia_aprendida FROM user_passports ORDER BY first_visit DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learning/discover - Descubre un país desde la ruleta y genera sus flashcards
router.post('/discover', async (req, res) => {
  const { countryCode } = req.body;

  if (!countryCode || !COUNTRY_FACTS[countryCode]) {
    return res.status(400).json({ error: 'Código de país inválido o no soportado en la simulación' });
  }

  const countryData = COUNTRY_FACTS[countryCode];

  try {
    await db.query('BEGIN');

    // 1. Insertar el país en el pasaporte si no existe
    const passportRes = await db.query(
      `INSERT INTO user_passports (country_code, country_name)
       VALUES ($1, $2)
       ON CONFLICT (country_code) DO NOTHING
       RETURNING *`,
      [countryCode, countryData.name]
    );

    const isNewCountry = passportRes.rowCount > 0;

    // 2. Si es nuevo, inicializar sus 4 flashcards en la cola de repetición espaciada
    if (isNewCountry) {
      for (const card of countryData.cards) {
        // Enlazar la categoría en la pregunta para poder clasificarla luego
        const questionText = `[${card.category}] ${card.question}`;
        await db.query(
          `INSERT INTO learning_cards (country_code, question, answer, repetition, interval, ease_factor, next_review)
           VALUES ($1, $2, $3, 0, 1, 2.50, CURRENT_TIMESTAMP)`,
          [countryCode, questionText, card.answer]
        );
      }
    }

    await db.query('COMMIT');

    res.json({
      message: isNewCountry ? `País ${countryData.name} descubierto y tarjetas creadas.` : `País ${countryData.name} ya estaba descubierto.`,
      countryName: countryData.name,
      countryCode,
      isNew: isNewCountry
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al descubrir país:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning/cards - Obtiene las tarjetas pendientes de repaso para hoy
router.get('/cards', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.id, c.country_code, p.country_name, c.question, c.answer, c.repetition, c.interval, c.ease_factor, c.next_review
      FROM learning_cards c
      JOIN user_passports p ON c.country_code = p.country_code
      WHERE c.next_review <= CURRENT_TIMESTAMP
      ORDER BY c.next_review ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learning/review - Procesa la respuesta de una tarjeta (algoritmo SM-2)
router.post('/review', async (req, res) => {
  const { cardId, grade } = req.body; // grade es un entero de 0 a 5

  if (cardId === undefined || grade === undefined || grade < 0 || grade > 5) {
    return res.status(400).json({ error: 'Parámetros inválidos. Se requiere cardId y un grade entre 0 y 5.' });
  }

  try {
    // 1. Obtener la tarjeta
    const cardRes = await db.query('SELECT id, country_code, question, repetition, interval, ease_factor FROM learning_cards WHERE id = $1', [cardId]);
    if (cardRes.rowCount === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const card = cardRes.rows[0];
    let repetition = parseInt(card.repetition);
    let interval = parseInt(card.interval);
    let easeFactor = parseFloat(card.ease_factor);

    // 2. Aplicar algoritmo estricto SuperMemo-2 (SM-2)
    if (grade >= 3) {
      // Repuesta correcta
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
    } else {
      // Respuesta incorrecta (reinicio)
      repetition = 0;
      interval = 1;
    }

    // Calcular nuevo Factor de Facilidad (EF)
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    // Calcular próxima fecha de revisión
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await db.query('BEGIN');

    // 3. Actualizar la tarjeta en Postgres
    await db.query(
      `UPDATE learning_cards
       SET repetition = $1, interval = $2, ease_factor = $3, last_reviewed = CURRENT_TIMESTAMP, next_review = $4
       WHERE id = $5`,
      [repetition, interval, easeFactor, nextReview, cardId]
    );

    // 4. Si la respuesta fue correcta (grade >= 4) y la tarjeta fue recordada con seguridad,
    // actualizamos el pasaporte para otorgar el sello visual de esa categoría.
    if (grade >= 4) {
      // Extraer la categoría de la pregunta (formato "[Categoría] Pregunta...")
      const match = card.question.match(/^\[(Cultura|Economía|Geografía|Ciencia)\]/);
      if (match) {
        const category = match[1];
        let columnName = '';
        
        if (category === 'Cultura') columnName = 'cultura_aprendida';
        else if (category === 'Economía') columnName = 'economia_aprendida';
        else if (category === 'Geografía') columnName = 'geografia_aprendida';
        else if (category === 'Ciencia') columnName = 'ciencia_aprendida';

        if (columnName) {
          await db.query(
            `UPDATE user_passports SET ${columnName} = TRUE WHERE country_code = $1`,
            [card.country_code]
          );
        }
      }
    }

    await db.query('COMMIT');

    res.json({
      message: 'Repaso registrado con éxito.',
      newRepetition: repetition,
      newInterval: interval,
      newEaseFactor: easeFactor,
      nextReviewDate: nextReview
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al procesar el repaso de la flashcard:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
