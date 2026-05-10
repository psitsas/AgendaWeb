import { api } from './client.js';

const base = (tenantId) => `/api/tenants/${tenantId}`;

export const bookingsApi = {
  /** Citas del día */
  getByDate: (tenantId, date) =>
    api.get(`${base(tenantId)}/bookings?date=${date}`),

  /** Slots disponibles */
  getSlots: (tenantId, serviceId, date) =>
    api.get(`${base(tenantId)}/availability?serviceId=${serviceId}&date=${date}`),

  /** Crear nueva cita */
  create: (tenantId, body) =>
    api.post(`${base(tenantId)}/bookings`, body),

  /** Cambiar estado */
  updateStatus: (tenantId, appointmentId, status) =>
    api.patch(`${base(tenantId)}/bookings/${appointmentId}/status`, { status }),
};
