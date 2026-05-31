import { apiRequest } from './client.js';

export const metricsApi = {
  getSummary:         () => apiRequest('/api/metrics/summary'),
  getBookingsPerDay:  () => apiRequest('/api/metrics/bookings-per-day'),
  getCancellationRate:() => apiRequest('/api/metrics/cancellation-rate'),
  getTopServices:     () => apiRequest('/api/metrics/top-services'),
  getTopClients:      () => apiRequest('/api/metrics/top-clients'),
  getEstimatedRevenue:() => apiRequest('/api/metrics/estimated-revenue'),
};
