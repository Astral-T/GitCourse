// Módulo del Feed de Noticias Científicas y Tecnológicas

const API_URL = 'http://localhost:3000/api/news';
let allNews = [];
let currentCategory = 'ALL';

// 1. CARGAR NOTICIAS DEL SERVIDOR
export async function loadNews() {
  const container = document.getElementById('news-feed-container');
  if (!container) return;

  try {
    const response = await fetch(API_URL);
    allNews = await response.json();
    
    renderNewsFeed();
  } catch (err) {
    console.error('Error al cargar las noticias:', err);
    container.innerHTML = `
      <div class="loading-placeholder">
        Error al conectar con el servidor de noticias. Por favor, verifica que el backend esté encendido.
      </div>
    `;
  }
}

// 2. RENDERIZAR LAS TARJETAS EN EL FEED
export function renderNewsFeed() {
  const container = document.getElementById('news-feed-container');
  if (!container) return;

  container.innerHTML = '';

  // Filtrar según categoría seleccionada
  const filtered = currentCategory === 'ALL' 
    ? allNews 
    : allNews.filter(item => item.category === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="loading-placeholder">
        No se encontraron noticias en la categoría '${currentCategory}'. Intenta actualizar los feeds.
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'news-card card-style-c purple';
    
    const pubDate = item.published_at ? new Date(item.published_at).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'Hoy';

    card.innerHTML = `
      <div class="news-meta">
        <span class="news-source">📡 ${item.source} • ${pubDate}</span>
        <span class="news-category-badge" data-cat="${item.category}">${item.category}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.summary ? item.summary : 'Descubre los detalles de este avance tecnológico accediendo a la fuente oficial...'}</p>
      <a href="${item.url}" target="_blank" class="news-link">Leer artículo completo ➔</a>
    `;

    // Añadir efecto de brillo interactivo al mover el ratón (Spotlight Glow)
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    container.appendChild(card);
  });
}

// 3. INICIALIZAR EVENTOS DE FILTROS Y ACTUALIZACIÓN
export function initNewsEvents() {
  // Configurar listeners de categorías
  const filterButtons = document.querySelectorAll('.category-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Quitar active de todos
      filterButtons.forEach(b => b.classList.remove('active'));
      // Añadir active a este
      btn.classList.add('active');

      currentCategory = btn.getAttribute('data-category');
      renderNewsFeed();
    });
  });

  // Configurar botón de refresco manual
  const btnSync = document.getElementById('btn-sync-news');
  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.textContent = '⏳ Sincronizando...';
      
      const container = document.getElementById('news-feed-container');
      if (container) {
        container.innerHTML = `<div class="loading-placeholder">Sincronizando y depurando feeds RSS en vivo...</div>`;
      }

      try {
        const response = await fetch(`${API_URL}/refresh`, { method: 'POST' });
        const data = await response.json();
        
        allNews = data.news;
        renderNewsFeed();
        
        console.log(`Feeds RSS sincronizados. ${data.new_articles} nuevos artículos.`);
      } catch (err) {
        console.error('Error al forzar refresco de noticias:', err);
        alert('Ocurrió un error al intentar descargar feeds RSS.');
        loadNews(); // recargar caché vieja
      } finally {
        btnSync.disabled = false;
        btnSync.textContent = '🔄 Actualizar Feeds';
      }
    });
  }
}
