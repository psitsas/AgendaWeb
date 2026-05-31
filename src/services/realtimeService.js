import * as signalR from '@microsoft/signalr';

let connection = null;

/**
 * Inicializa la conexión SignalR con el panel.
 * @param {string} jwtToken - Token JWT del propietario
 * @param {(eventType: string, payload: object) => void} onEvent - Callback por evento
 */
export async function initRealtime(jwtToken, onEvent) {
  if (connection) return; // ya conectado

  connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/agenda', {
      accessTokenFactory: () => jwtToken,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on('ReceiveDomainEvent', (eventType, payload) => {
    onEvent(eventType, payload);
  });

  connection.on('ReceiveConnectionAck', (tenantId, connectionId) => {
    console.info(`[Agendi] Panel conectado en tiempo real. Tenant: ${tenantId}`);
    updateLiveIndicator(true);
  });

  connection.onclose(()       => updateLiveIndicator(false));
  connection.onreconnecting(() => updateLiveIndicator(false));
  connection.onreconnected(()  => updateLiveIndicator(true));

  try {
    await connection.start();
  } catch (err) {
    console.error('[Agendi] Error conectando SignalR:', err);
    updateLiveIndicator(false);
  }
}

export function stopRealtime() {
  connection?.stop();
  connection = null;
}

function updateLiveIndicator(isLive) {
  const badge = document.getElementById('live-badge');
  if (!badge) return;
  badge.textContent = isLive ? '● En vivo' : '○ Reconectando...';
  badge.className   = isLive ? 'live-badge live-badge--on' : 'live-badge live-badge--off';
}
