import { metricsApi } from '../api/metrics.js';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export async function renderDashboard(_tenantId, container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <span class="date-label" id="last-updated"></span>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Citas hoy</div>
        <div class="metric-value" id="m-today">—</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Lista de espera</div>
        <div class="metric-value" id="m-waitlist">—</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Tasa cancelación (30 días)</div>
        <div class="metric-value" id="m-cancel-rate">—</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Ingresos estimados (30 días)</div>
        <div class="metric-value metric-revenue" id="m-revenue">—</div>
      </div>
      <div class="metric-card metric-card--calendar">
        <div class="metric-label">Google Calendar</div>
        <div class="metric-value" id="m-calendar">—</div>
      </div>
    </div>

    <div class="chart-section">
      <h2>Reservas últimos 30 días</h2>
      <canvas id="chart-bookings" style="max-height:280px"></canvas>
    </div>

    <div class="ranks-grid">
      <div class="rank-card">
        <h2>Top servicios</h2>
        <div id="top-services">—</div>
      </div>
      <div class="rank-card">
        <h2>Clientes frecuentes</h2>
        <div id="top-clients">—</div>
      </div>
    </div>
  `;

  await loadMetrics();

  // Actualizar cada 5 minutos
  const timer = setInterval(loadMetrics, 5 * 60 * 1000);

  // Limpiar timer cuando la página cambia
  window.addEventListener('hashchange', () => clearInterval(timer), { once: true });
}

async function loadMetrics() {
  try {
    const [summary, perDay, cancelRate, topServices, topClients, revenue] = await Promise.all([
      metricsApi.getSummary(),
      metricsApi.getBookingsPerDay(),
      metricsApi.getCancellationRate(),
      metricsApi.getTopServices(),
      metricsApi.getTopClients(),
      metricsApi.getEstimatedRevenue(),
    ]);

    // Métricas rápidas
    setText('m-today',       summary.appointmentsToday);
    setText('m-waitlist',    summary.waitlistPending);
    setText('m-cancel-rate', `${cancelRate.cancellationRatePercent}%`);
    setText('m-revenue',     COP.format(revenue.estimatedRevenueLast30Days));
    setText('m-calendar',    summary.calendarConnected ? '✅ Conectado' : '❌ No conectado');

    setText('last-updated',
      `Actualizado: ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`);

    // Gráfico de barras
    renderChart(perDay);

    // Rankings
    renderTopServices(topServices);
    renderTopClients(topClients);

  } catch (err) {
    console.error('[Dashboard] Error cargando métricas:', err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '—';
}

let chartInstance = null;

function renderChart(perDay) {
  const canvas = document.getElementById('chart-bookings');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    // Chart.js no cargado aún — intentar cargarlo
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    script.onload = () => buildChart(canvas, perDay);
    document.head.appendChild(script);
    return;
  }

  buildChart(canvas, perDay);
}

function buildChart(canvas, perDay) {
  if (chartInstance) {
    chartInstance.data.labels   = perDay.map(d => d.date.slice(5)); // MM-DD
    chartInstance.data.datasets[0].data = perDay.map(d => d.count);
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels  : perDay.map(d => d.date.slice(5)),
      datasets: [{
        label          : 'Reservas',
        data           : perDay.map(d => d.count),
        backgroundColor: '#c8102e',
        borderRadius   : 4,
      }],
    },
    options: {
      responsive : true,
      plugins    : { legend: { display: false } },
      scales     : { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
}

function renderTopServices(services) {
  const el = document.getElementById('top-services');
  if (!el) return;
  if (!services.length) { el.innerHTML = '<p class="empty-state-sm">Sin datos</p>'; return; }

  el.innerHTML = services.map((s, i) =>
    `<div class="rank-item">
       <span class="rank-pos">#${i + 1}</span>
       <span class="rank-name">${s.serviceName}</span>
       <span class="rank-count">${s.count} reservas</span>
     </div>`
  ).join('');
}

function renderTopClients(clients) {
  const el = document.getElementById('top-clients');
  if (!el) return;
  if (!clients.length) { el.innerHTML = '<p class="empty-state-sm">Sin datos</p>'; return; }

  el.innerHTML = clients.map((c, i) =>
    `<div class="rank-item">
       <span class="rank-pos">#${i + 1}</span>
       <span class="rank-name">${c.clientName}</span>
       <span class="rank-count">${c.totalVisits} visitas</span>
     </div>`
  ).join('');
}
