import express from 'express';
import Parser from 'rss-parser';
import db from '../db.js';

const router = express.Router();
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, image/webp, */*;q=0.8'
  }
});

// Fuentes RSS seleccionadas por su alta calidad y consistencia
const FEEDS = [
  { source: 'Nature', url: 'https://www.nature.com/nature.rss', defaultCategory: 'Ciencia' },
  { source: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', defaultCategory: 'Ciencia' },
  { source: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', defaultCategory: 'Tecnología' },
  { source: 'TechCrunch', url: 'https://techcrunch.com/feed/', defaultCategory: 'Economía' },
  { source: 'CNBC Finance', url: 'https://search.cnbc.com/rs/search/all/rss.xml', defaultCategory: 'Economía' },
  { source: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', defaultCategory: 'Economía' }
];

// Palabras clave para filtrar noticias de política, elecciones y regulaciones legales
const FORBIDDEN_WORDS = [
  'política', 'politica', 'político', 'politico', 'senado', 'congreso', 'ley ', 'leyes', 'decreto', 
  'elección', 'eleccion', 'elecciones', 'voto', 'votar', 'partido político', 'gobierno', 'biden', 'trump', 
  'court', 'senate', 'congress', 'law ', 'laws', 'election', 'elections', 'parlamento', 'parliament', 
  'presidencial', 'tribunal', 'juez', 'fiscal', 'democrat', 'republican', 'legislat', 'goverment',
  'supreme court', 'white house', 'parlamentario', 'ministerio', 'ministro', 'diputado'
];

// Función para determinar la categoría basada en palabras clave del título o resumen
function detectCategory(title, summary, defaultCat) {
  const text = `${title} ${summary || ''}`.toLowerCase();
  
  if (
    text.includes('econom') || text.includes('market') || text.includes('dollar') || 
    text.includes('stock') || text.includes('trade') || text.includes('crypto') || 
    text.includes('finance') || text.includes('business') || text.includes('banco') || 
    text.includes('mercado') || text.includes('acciones') || text.includes('empresa') ||
    text.includes('startup') || text.includes('funding') || text.includes('acquisition')
  ) {
    return 'Economía';
  }
  
  if (
    text.includes('biology') || text.includes('gene') || text.includes('dna') || 
    text.includes('cell') || text.includes('biotech') || text.includes('biología') || 
    text.includes('célula') || text.includes('genética') || text.includes('organismo') || 
    text.includes('médico') || text.includes('health') || text.includes('medicina') ||
    text.includes('bacteria') || text.includes('virus') || text.includes('protein')
  ) {
    return 'Biología';
  }
  
  if (
    text.includes('tech') || text.includes('software') || text.includes('ai') || 
    text.includes('robot') || text.includes('comput') || text.includes('cyber') || 
    text.includes('artificial intelligence') || text.includes('algorit') ||
    text.includes('smartphone') || text.includes('gadget') || text.includes('internet')
  ) {
    return 'Tecnología';
  }
  
  if (
    text.includes('engineer') || text.includes('spacecraft') || text.includes('fusion') || 
    text.includes('nuclear') || text.includes('material') || text.includes('construc') || 
    text.includes('ingeniería') || text.includes('diseño') || text.includes('physics') ||
    text.includes('rocket') || text.includes('nasa') || text.includes('física') ||
    text.includes('quantum') || text.includes('cuántico')
  ) {
    return 'Ingeniería';
  }

  return defaultCat;
}

// Verifica si un texto contiene palabras políticas/legales prohibidas
function isForbidden(title, summary) {
  const text = `${title} ${summary || ''}`.toLowerCase();
  return FORBIDDEN_WORDS.some(word => text.includes(word));
}

// Función para sincronizar noticias desde los feeds RSS a Postgres
async function refreshNews() {
  console.log('Iniciando sincronización de noticias desde feeds RSS en paralelo...');
  let totalSaved = 0;

  const promises = FEEDS.map(async (feed) => {
    try {
      const parsedFeed = await parser.parseURL(feed.url);
      let feedSaved = 0;
      
      for (const item of parsedFeed.items) {
        const title = item.title || '';
        let summary = item.contentSnippet || item.content || item.summary || '';
        if (!summary || summary.trim() === '') {
          summary = `Este artículo publicado en ${feed.source} describe las últimas investigaciones y desarrollos científicos sobre "${title}". Haz clic a continuación para visitar la fuente original.`;
        }
        const url = item.link;
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        // 1. Aplicar filtro estricto anti-política y anti-leyes
        if (isForbidden(title, summary)) {
          continue;
        }

        // 2. Clasificar dinámicamente en una categoría
        const category = detectCategory(title, summary, feed.defaultCategory);

        // 3. Guardar en Postgres ignorando duplicados por título
        const queryText = `
          INSERT INTO news_cache (title, summary, url, source, category, published_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (title) DO NOTHING
        `;
        const res = await db.query(queryText, [
          title, 
          summary.substring(0, 500), // limitar tamaño de resumen
          url, 
          feed.source, 
          category, 
          publishedAt
        ]);

        if (res.rowCount > 0) {
          feedSaved++;
        }
      }
      return feedSaved;
    } catch (err) {
      console.error(`Error al procesar el feed de ${feed.source}:`, err.message);
      return 0;
    }
  });

  const results = await Promise.all(promises);
  totalSaved = results.reduce((acc, curr) => acc + curr, 0);

  console.log(`Sincronización finalizada. Se agregaron ${totalSaved} nuevas noticias.`);
  return totalSaved;
}

// GET /api/news - Retorna las noticias cacheadas en la DB
router.get('/', async (req, res) => {
  try {
    // Verificar si la caché está vacía
    const cacheCheck = await db.query('SELECT COUNT(*) FROM news_cache');
    const count = parseInt(cacheCheck.rows[0].count);

    // Si está vacía o si ha pasado más de 1 hora desde la última actualización, refrescar
    let shouldRefresh = count === 0;

    if (count > 0) {
      const timeCheck = await db.query('SELECT MAX(fetched_at) as last_fetch FROM news_cache');
      const lastFetch = new Date(timeCheck.rows[0].last_fetch);
      const diffMs = new Date() - lastFetch;
      const diffMinutes = Math.floor(diffMs / 1000 / 60);
      
      if (diffMinutes > 60) {
        shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      // Intentar refrescar en segundo plano para no demorar la respuesta
      refreshNews().catch(err => console.error('Error en refresh de fondo:', err));
    }

    // Retornar las noticias (máximo 50) ordenadas por fecha de publicación
    const result = await db.query(
      'SELECT id, title, summary, url, source, category, published_at FROM news_cache ORDER BY published_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/news/refresh - Forzar actualización manual
router.post('/refresh', async (req, res) => {
  try {
    const totalSaved = await refreshNews();
    
    const result = await db.query(
      'SELECT id, title, summary, url, source, category, published_at FROM news_cache ORDER BY published_at DESC LIMIT 50'
    );
    res.json({
      message: 'Refresco exitoso',
      new_articles: totalSaved,
      news: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
