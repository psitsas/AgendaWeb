import { bookingsApi } from '../api/bookings.js';
import { initRealtime } from '../services/realtimeService.js';

const STATUS_LABEL = {
  Pending:   'Pendiente',
  Confirmed: 'Confirmada',
  Cancelled: 'Cancelada',
  NoShow:    'No asistió',
  Completed: 'Completada',
};

export async function renderAgenda(tenantId, container) {
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <h1>Agenda de hoy</h1>
      <span class="date-label">${formatDate(new Date())}</span>
      <button class="btn-secondary" id="btn-refresh">↻ Actualizar</button>
    </div>
    <div id="appointments-container">
      <div class="loading">Cargando citas...</div>
    </div>
  `;

  document.getElementById('btn-refresh').addEventListener('click',
    () => loadAppointments(tenantId, today));

  await loadAppointments(tenantId, today);

  // Inicializar tiempo real — los eventos actualizan la vista sin recargar
  const jwt = localStorage.getItem('agendi_token');
  if (jwt) {
    const today2 = today; // capturar para el closure
    await initRealtime(jwt, (eventType, payload) => {
      handleRealtimeEvent(eventType, payload, tenantId, today2);
    });
  }
}

async function loadAppointments(tenantId, date) {
  const apptContainer = document.getElementById('appointments-container');
  if (!apptContainer) return;

  apptContainer.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const bookings = await bookingsApi.getByDate(tenantId, date);

    if (!bookings.length) {
      apptContainer.innerHTML = `
        <div class="empty-state">
          <p>📅 Sin citas para hoy</p>
          <small>Las nuevas citas aparecerán aquí automáticamente</small>
        </div>`;
      return;
    }

    apptContainer.innerHTML = `
      <div class="stats-bar">
        <span>${bookings.length} citas ·
          ${bookings.filter(b => b.status === 'Confirmed').length} confirmadas ·
          ${bookings.filter(b => b.status === 'Completed').length} completadas
        </span>
      </div>
      <div class="appointments-list">
        ${bookings.map(b => renderCard(b)).join('')}
      </div>
    `;

    // Eventos de acción
    apptContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { id, action } = btn.dataset;
        const status = action === 'complete' ? 'Completed' : 'Cancelled';
        btn.disabled = true;
        try {
          await bookingsApi.updateStatus(tenantId, id, status);
          await loadAppointments(tenantId, date);
        } catch (err) {
          alert(`Error: ${err.message}`);
          btn.disabled = false;
        }
      });
    });

  } catch (err) {
    apptContainer.innerHTML =
      `<div class="error-msg">Error cargando citas: ${err.message}</div>`;
  }
}

function renderCard(appt) {
  const time  = new Date(appt.startTime).toLocaleTimeString('es-CO',
    { hour: '2-digit', minute: '2-digit' });
  const label = STATUS_LABEL[appt.status] ?? appt.status;

  const actions = appt.status === 'Confirmed' || appt.status === 'Pending'
    ? `<button class="btn-success" data-action="complete" data-id="${appt.id}">✓ Completar</button>
       <button class="btn-danger"  data-action="cancel"   data-id="${appt.id}">✕ Cancelar</button>`
    : '';

  return `
    <div class="appt-card status-${appt.status.toLowerCase()}">
      <div class="appt-time">${time}</div>
      <div class="appt-info">
        <strong class="appt-client">${appt.clientName}</strong>
        <span class="appt-service">${appt.serviceName}</span>
        <a class="appt-phone" href="tel:${appt.clientPhone}">${appt.clientPhone}</a>
      </div>
      <div class="appt-actions">
        <span class="status-badge badge-${appt.status.toLowerCase()}">${label}</span>
        ${actions}
      </div>
    </div>
  `;
}

function formatDate(date) {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Tiempo real ────────────────────────────────────────────────────────────

function handleRealtimeEvent(eventType, payload, tenantId, today) {
  switch (eventType) {
    case 'booking.created':
      appendAppointmentCard(payload);
      showToast(`📅 Nueva reserva: ${payload.clientName} — ${payload.startTimeLocal}`);
      break;

    case 'appointment.cancelled':
      markAppointmentCancelled(payload.appointmentId);
      showToast(`❌ Cancelación: ${payload.clientName}`, 'warning');
      break;

    case 'appointment.rescheduled':
      markAppointmentCancelled(payload.oldAppointmentId);
      appendAppointmentCard({
        appointmentId  : payload.newAppointmentId,
        clientName     : payload.clientName,
        serviceName    : payload.serviceName,
        startTimeLocal : payload.newStartTimeLocal,
        status         : 'Confirmed',
        channel        : 'WhatsApp',
      });
      showToast(`🔄 Reagendado: ${payload.clientName} → ${payload.newStartTimeLocal}`, 'info');
      break;
  }
}

function appendAppointmentCard(payload) {
  const list = document.querySelector('.appointments-list');
  const empty = document.querySelector('.empty-state');

  // Si no hay lista aún, reemplazar empty-state con contenedor
  if (!list) {
    const container = document.getElementById('appointments-container');
    if (!container) return;
    container.innerHTML = `
      <div class="stats-bar"><span id="stats-text">1 cita · 1 confirmada · 0 completadas</span></div>
      <div class="appointments-list"></div>
    `;
  }

  const apptList = document.querySelector('.appointments-list');
  if (!apptList) return;

  const div = document.createElement('div');
  div.id        = `appt-${payload.appointmentId}`;
  div.className = 'appt-card status-confirmed appt-new';
  div.innerHTML = `
    <div class="appt-time">${payload.startTimeLocal?.split(' ')[1] ?? ''}</div>
    <div class="appt-info">
      <strong class="appt-client">${payload.clientName}</strong>
      <span class="appt-service">${payload.serviceName}</span>
      <span class="appt-channel">via ${payload.channel ?? 'WhatsApp'}</span>
    </div>
    <div class="appt-actions">
      <span class="status-badge badge-confirmed">Confirmada</span>
    </div>
  `;
  apptList.prepend(div);

  // Quitar animación después de 1s
  setTimeout(() => div.classList.remove('appt-new'), 1000);
}

function markAppointmentCancelled(appointmentId) {
  const card = document.getElementById(`appt-${appointmentId}`);
  if (!card) return;
  card.className = 'appt-card status-cancelled';
  const badge = card.querySelector('.status-badge');
  if (badge) { badge.className = 'status-badge badge-cancelled'; badge.textContent = 'Cancelada'; }
  card.querySelectorAll('button').forEach(b => b.remove());
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-visible'), 10);
  setTimeout(() => { toast.classList.remove('toast-visible'); setTimeout(() => toast.remove(), 300); }, 4000);
}
