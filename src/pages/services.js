import { api } from '../api/client.js';

export async function renderServices(tenantId, container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Servicios</h1>
      <button class="btn-primary" id="btn-new-service">+ Nuevo servicio</button>
    </div>
    <div id="services-list"><div class="loading">Cargando...</div></div>
  `;

  await loadServices(tenantId);

  document.getElementById('btn-new-service').addEventListener('click', () => {
    showServiceForm(tenantId, null);
  });
}

async function loadServices(tenantId) {
  const list = document.getElementById('services-list');
  try {
    const services = await api.get(`/api/tenants/${tenantId}/services`);

    if (!services?.length) {
      list.innerHTML = '<div class="empty-state">Sin servicios configurados aún.</div>';
      return;
    }

    list.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Duración</th>
            <th>Precio</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${services.map(s => `
            <tr>
              <td>
                <strong>${s.name}</strong>
                ${s.description ? `<small>${s.description}</small>` : ''}
              </td>
              <td>${s.durationMinutes} min</td>
              <td>${s.price > 0 ? `$${s.price.toLocaleString('es-CO')}` : 'Gratis'}</td>
              <td>
                <span class="status-badge ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}">
                  ${s.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    list.innerHTML = `<div class="error-msg">Error: ${err.message}</div>`;
  }
}

function showServiceForm(tenantId, service) {
  // Modal simple inline
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>${service ? 'Editar' : 'Nuevo'} servicio</h2>
      <form id="service-form">
        <div class="field">
          <label>Nombre</label>
          <input name="name" type="text" value="${service?.name ?? ''}" required />
        </div>
        <div class="field">
          <label>Descripción</label>
          <textarea name="description">${service?.description ?? ''}</textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Duración (min)</label>
            <input name="durationMinutes" type="number" min="5" max="480"
                   value="${service?.durationMinutes ?? 30}" required />
          </div>
          <div class="field">
            <label>Precio (COP)</label>
            <input name="price" type="number" min="0"
                   value="${service?.price ?? 0}" required />
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="btn-cancel-modal">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('btn-cancel-modal').onclick = () => overlay.remove();

  document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name:            fd.get('name'),
      description:     fd.get('description'),
      durationMinutes: Number(fd.get('durationMinutes')),
      price:           Number(fd.get('price')),
      isActive:        true,
    };
    try {
      if (service) {
        await api.put(`/api/tenants/${tenantId}/services/${service.id}`, body);
      } else {
        await api.post(`/api/tenants/${tenantId}/services`, body);
      }
      overlay.remove();
      await loadServices(tenantId);
    } catch (err) {
      alert(`Error guardando: ${err.message}`);
    }
  });
}
