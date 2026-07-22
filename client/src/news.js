// Módulo del Feed de Noticias Científicas y Tecnológicas

const API_URL = '/api/news';
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

  const filtered = currentCategory === 'ALL' 
    ? allNews 
    : allNews.filter(item => item.category === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="loading-placeholder">
        No se encontraron noticias en la categoría '${currentCategory}'. Intenta actualizar los feeds en la esquina superior.
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'news-card card-style-c purple';
    card.style.cursor = 'pointer';
    
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
      <p>${item.summary ? item.summary : 'Descubre los detalles de este avance científico en nuestro visor integrado...'}</p>
      <span class="news-link-btn">Ver Resumen Completo ➔</span>
    `;

    // Abrir modal de resumen al hacer click en cualquier parte de la tarjeta
    card.addEventListener('click', () => {
      openNewsModal(item);
    });

    // Spotlight Glow
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

// 3. ABRIR MODAL CON RESUMEN EN LA MISMA APP
function openNewsModal(item) {
  const modal = document.getElementById('news-summary-modal');
  if (!modal) return;

  const pubDate = item.published_at ? new Date(item.published_at).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Hoy';

  document.getElementById('news-modal-category').textContent = item.category;
  document.getElementById('news-modal-title').textContent = item.title;
  document.getElementById('news-modal-source').textContent = `📡 Fuente: ${item.source}`;
  document.getElementById('news-modal-date').textContent = pubDate;

  // Rellenar cuerpo del resumen
  const summaryContent = document.getElementById('news-modal-summary-content');
  if (summaryContent) {
    summaryContent.innerHTML = `
      <p class="summary-paragraph">${item.summary || 'Resumen de avance e investigación científica.'}</p>
      <p class="summary-disclaimer">🛡️ Resumen optimizado por el Portal. Libre de anuncios invasivos de terceros.</p>
    `;
  }

  const linkEl = document.getElementById('news-modal-link');
  if (linkEl) {
    linkEl.href = item.url;
  }

  modal.classList.remove('hidden');
}

// 4. INICIALIZAR EVENTOS
export function initNewsEvents() {
  const filterButtons = document.querySelectorAll('.category-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderNewsFeed();
    });
  });

  const btnSync = document.getElementById('btn-sync-news');
  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.textContent = '⏳ Sincronizando...';
      
      const container = document.getElementById('news-feed-container');
      if (container) {
        container.innerHTML = `<div class="loading-placeholder">Sincronizando feeds en paralelo...</div>`;
      }

      try {
        const response = await fetch(`${API_URL}/refresh`, { method: 'POST' });
        const data = await response.json();
        allNews = data.news;
        renderNewsFeed();
      } catch (err) {
        console.error('Error al forzar refresco de noticias:', err);
        alert('Ocurrió un error al intentar descargar feeds RSS.');
        loadNews();
      } finally {
        btnSync.disabled = false;
        btnSync.textContent = '🔄 Actualizar Feeds';
      }
    });
  }

  // Cerrar modal de noticias
  const modal = document.getElementById('news-summary-modal');
  const btnClose = document.getElementById('btn-close-news-modal');
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}
