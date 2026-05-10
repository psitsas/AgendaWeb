import { apiRequest } from '../api/client.js';

const EYE_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

const EYE_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
  <line x1="1" y1="1" x2="23" y2="23"/>
</svg>`;

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">

        <!-- Cabecera con degradado corporativo -->
        <div class="login-header">
          <div class="login-brand-icon">A</div>
          <span class="logo-text">Agendi</span>
          <span class="logo-sub">Panel de administración</span>
        </div>

        <!-- Cuerpo -->
        <div class="login-body">
          <form id="login-form" novalidate>

            <div class="field">
              <label for="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="tu@negocio.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <div class="input-icon-wrap">
                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="input-icon-btn"
                  id="toggle-password"
                  aria-label="Mostrar u ocultar contraseña"
                  title="Mostrar / ocultar contraseña"
                >${EYE_OPEN}</button>
              </div>
            </div>

            <p id="login-error" class="error-msg" hidden></p>

            <button type="submit" class="btn-primary" id="login-btn"
                    style="width:100%; justify-content:center; padding:.65rem; font-size:.95rem; margin-top:.25rem;">
              Ingresar al panel
            </button>

          </form>

          <p class="login-footer">
            ¿Aún no tienes cuenta?
            <a href="#register">Registra tu negocio</a>
          </p>
        </div>

        <!-- Copyright PSIT -->
        <div class="login-copyright">
          © 2026 <strong>PSIT</strong> — Productora de Soluciones Informáticas y Tecnológicas<br>
          Todos los derechos reservados.
        </div>

      </div>
    </div>
  `;

  // ── Ojo para ver/ocultar contraseña ──────────────────────────────
  const toggleBtn  = document.getElementById('toggle-password');
  const passwordEl = document.getElementById('password');
  let   visible    = false;

  toggleBtn.addEventListener('click', () => {
    visible = !visible;
    passwordEl.type      = visible ? 'text' : 'password';
    toggleBtn.innerHTML  = visible ? EYE_CLOSED : EYE_OPEN;
    toggleBtn.title      = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';
  });

  // ── Envío del formulario ─────────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('login-btn');
  const errorEl  = document.getElementById('login-error');

  errorEl.hidden = true;
  btn.disabled   = true;
  btn.textContent = 'Verificando...';

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });

    // Guardar sesión
    localStorage.setItem('agendi_token',       data.accessToken);
    localStorage.setItem('agendi_tenant_id',   data.tenantId);
    localStorage.setItem('agendi_tenant_slug', data.tenantSlug);

    // Redirigir al panel
    window.location.hash = '#agenda';

  } catch (err) {
    errorEl.textContent = err.message === 'HTTP 401'
      ? 'Correo o contraseña incorrectos. Verifica tus datos.'
      : (err.message || 'No se pudo conectar. Intenta de nuevo.');
    errorEl.hidden = false;
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Ingresar al panel';
  }
}
