import { apiRequest } from '../api/client.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-text">Agendi</span>
        <span class="logo-sub">Panel de administración</span>
      </div>

      <form id="login-form" novalidate>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" placeholder="admin@minegocio.com"
                 autocomplete="email" required />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" type="password" placeholder="••••••••"
                 autocomplete="current-password" required />
        </div>
        <p id="login-error" class="error-msg" hidden></p>
        <button type="submit" class="btn-primary" id="login-btn">
          Ingresar
        </button>
      </form>

      <p class="login-footer">
        ¿Aún no tienes cuenta?
        <a href="#register">Registra tu negocio</a>
      </p>
    </div>
  `;

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
  btn.textContent = 'Ingresando...';

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });

    // Guardar sesión
    localStorage.setItem('agendi_token',     data.accessToken);
    localStorage.setItem('agendi_tenant_id', data.tenantId);

    // Redirigir al panel
    window.location.hash = '#agenda';

  } catch (err) {
    errorEl.textContent = err.message || 'Credenciales incorrectas.';
    errorEl.hidden = false;
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Ingresar';
  }
}
