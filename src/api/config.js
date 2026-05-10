import { api } from './client.js';

export const configApi = {
  /** Obtener configuración del negocio */
  get: (tenantId) =>
    api.get(`/api/tenants/${tenantId}/config`),

  /** Actualizar configuración */
  update: (tenantId, config) =>
    api.put(`/api/tenants/${tenantId}/config`, config),
};
