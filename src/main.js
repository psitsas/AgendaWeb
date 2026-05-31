/**
 * Punto de entrada — enrutador SPA simple basado en location.hash.
 */
import { renderNavbar }    from './components/navbar.js';
import { renderLogin }     from './pages/login.js';
import { renderAgenda }    from './pages/agenda.js';
import { renderServices }  from './pages/services.js';
import { renderSettings }  from './pages/settings.js';
import { renderDashboard } from './pages/dashboard.js';

const mainContent = document.getElementById('main-content');

function isAuthenticated() {
  return !!localStorage.getItem('agendi_token');
}

function getTenantId() {
  return localStorage.getItem('agendi_tenant_id');
}

async function router() {
  // Sin autenticación → login
  if (!isAuthenticated()) {
    document.getElementById('navbar').innerHTML = '';
    renderLogin(mainContent);
    return;
  }

  const tenantId   = getTenantId();
  const tenantSlug = localStorage.getItem('agendi_tenant_slug') ?? '';
  const page       = window.location.hash.replace('#', '') || 'agenda';

  renderNavbar(tenantSlug);

  switch (page) {
    case 'agenda':
      await renderAgenda(tenantId, mainContent);
      break;
    case 'services':
      await renderServices(tenantId, mainContent);
      break;
    case 'settings':
      await renderSettings(tenantId, mainContent);
      break;
    case 'dashboard':
      await renderDashboard(tenantId, mainContent);
      break;
    default:
      mainContent.innerHTML = '<div class="error-msg">Página no encontrada.</div>';
  }
}

// Iniciar enrutador
window.addEventListener('hashchange', router);
router();
