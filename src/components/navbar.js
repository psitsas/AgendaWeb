/**
 * Navbar persistente con enrutamiento por hash (#agenda, #services, #settings).
 */
export function renderNavbar(tenantSlug) {
  const navbar = document.getElementById('navbar');

  navbar.innerHTML = `
    <div class="nav-brand">
      <span class="logo-text">Agendi</span>
      <span class="nav-tenant">${tenantSlug ?? ''}</span>
    </div>
    <ul class="nav-links">
      <li><a href="#agenda"   class="nav-link" data-page="agenda">📅 Agenda</a></li>
      <li><a href="#services" class="nav-link" data-page="services">✂️ Servicios</a></li>
      <li><a href="#settings" class="nav-link" data-page="settings">⚙️ Configuración</a></li>
    </ul>
    <button class="btn-logout" id="btn-logout">Salir</button>
  `;

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.hash = '';
    window.location.reload();
  });

  // Marcar enlace activo
  function setActive() {
    const page = window.location.hash.replace('#', '') || 'agenda';
    navbar.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });
  }

  window.addEventListener('hashchange', setActive);
  setActive();
}
