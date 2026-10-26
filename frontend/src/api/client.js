const BASE_URL = import.meta.env?.VITE_API_URL || '/api';

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

export const api = {
  // Dashboard & Metrics
  getDashboardSummary: () => fetchJSON(`${BASE_URL}/dashboard/summary`),
  getRecentAccessEvents: (limit = 10) => fetchJSON(`${BASE_URL}/access-events/recent?limit=${limit}`),
  getAccessEvents: (ward_type = 'ALL', status = 'ALL', limit = 50) => {
    let url = `${BASE_URL}/access-events?limit=${limit}`;
    if (ward_type && ward_type !== 'ALL') url += `&ward_type=${ward_type}`;
    if (status && status !== 'ALL') url += `&status=${status}`;
    return fetchJSON(url);
  },

  // Bed Zones
  getBedZones: (ward_type = 'ALL') => {
    let url = `${BASE_URL}/bed-zones`;
    if (ward_type && ward_type !== 'ALL') url += `?ward_type=${ward_type}`;
    return fetchJSON(url);
  },
  createBedZone: (payload) => fetchJSON(`${BASE_URL}/bed-zones`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Staff Management
  getStaff: (status, role) => {
    let url = `${BASE_URL}/staff`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (role) params.push(`role=${role}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return fetchJSON(url);
  },
  createStaff: (payload) => fetchJSON(`${BASE_URL}/staff`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateStaffStatus: (staffId, status) => fetchJSON(`${BASE_URL}/staff/${staffId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Devices & Heartbeat
  getDevices: () => fetchJSON(`${BASE_URL}/devices`),
  sendHeartbeat: (device_id, status = 'ONLINE') => fetchJSON(`${BASE_URL}/device/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ device_id, status })
  }),

  // RFID Scan Simulation (Matches real ESP32 POST request)
  simulateScan: ({ device_id, bed_zone_id, rfid_uid, event_type = 'ACCESS_REQUEST' }) => 
    fetchJSON(`${BASE_URL}/rfid/scan`, {
      method: 'POST',
      body: JSON.stringify({ device_id, bed_zone_id, rfid_uid, event_type })
    }),

  // Demo Reset
  resetDemo: () => fetchJSON(`${BASE_URL}/reset-demo`, { method: 'POST' })
};
