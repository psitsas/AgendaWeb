import { configApi } from '../api/config.js';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_ES = {
  Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
  Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo',
};

export async function renderSettings(tenantId, container) {
  container.innerHTML = `
    <div class="page-header"><h1>Configuración del negocio</h1></div>
    <div class="loading">Cargando...</div>
  `;

  try {
    const config = await configApi.get(tenantId);
    container.innerHTML = `
      <div class="page-header"><h1>Configuración del negocio</h1></div>
      <form id="settings-form" class="settings-form">

        <section class="card">
          <h2>Horario semanal</h2>
          <div class="schedule-grid">
            ${DAYS.map(day => {
              const s = config.weeklySchedule?.[day] ?? { open: '08:00', close: '18:00', isOpen: day !== 'Sunday' };
              return `
                <div class="schedule-row">
                  <label class="day-toggle">
                    <input type="checkbox" name="day_${day}" ${s.isOpen ? 'checked' : ''} />
                    ${DAY_ES[day]}
                  </label>
                  <input type="time" name="open_${day}"  value="${s.open}"  />
                  <span>–</span>
                  <input type="time" name="close_${day}" value="${s.close}" />
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <section class="card">
          <h2>Mensajes automáticos</h2>
          <div class="field">
            <label>Mensaje de bienvenida</label>
            <textarea name="welcomeMessage" rows="3">${config.welcomeMessage ?? ''}</textarea>
          </div>
          <div class="field">
            <label>Mensaje de confirmación</label>
            <textarea name="confirmationMessage" rows="3">${config.confirmationMessage ?? ''}</textarea>
          </div>
        </section>

        <section class="card">
          <h2>Recordatorios</h2>
          <div class="field">
            <label>Anticipación del recordatorio (horas antes)</label>
            <input type="number" name="reminderOffsetHours"
                   min="1" max="72" value="${config.reminderOffsetHours ?? 24}" />
          </div>
        </section>

        <div class="form-footer">
          <button type="submit" class="btn-primary">Guardar cambios</button>
          <span id="save-msg" hidden class="success-msg">✓ Guardado</span>
        </div>
      </form>
    `;

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);

      const weeklySchedule = {};
      DAYS.forEach(day => {
        weeklySchedule[day] = {
          open:   fd.get(`open_${day}`)  || '08:00',
          close:  fd.get(`close_${day}`) || '18:00',
          isOpen: fd.get(`day_${day}`) === 'on',
        };
      });

      const body = {
        weeklySchedule,
        welcomeMessage:      fd.get('welcomeMessage'),
        confirmationMessage: fd.get('confirmationMessage'),
        reminderOffsetHours: Number(fd.get('reminderOffsetHours')),
        timezone:            config.timezone || 'America/Bogota',
      };

      try {
        await configApi.update(tenantId, body);
        const msg = document.getElementById('save-msg');
        msg.hidden = false;
        setTimeout(() => msg.hidden = true, 3000);
      } catch (err) {
        alert(`Error guardando: ${err.message}`);
      }
    });

  } catch (err) {
    container.innerHTML += `<div class="error-msg">Error: ${err.message}</div>`;
  }
}
