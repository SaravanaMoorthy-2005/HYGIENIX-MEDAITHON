import React from 'react';
import { ShieldCheck, AlertCircle, Ban, HelpCircle } from 'lucide-react';

function formatTimestamp(isoString) {
  if (!isoString) return '--:--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (e) {
    return isoString;
  }
}

export default function AccessEventTable({ events = [], title = "Live Access Event Log" }) {
  const getRoleBadge = (role) => {
    if (!role) return <span style={{ color: '#94a3b8' }}>-</span>;
    const lower = role.toLowerCase();
    let badgeClass = 'badge-other';
    if (lower === 'doctor') badgeClass = 'badge-doctor';
    if (lower === 'nurse') badgeClass = 'badge-nurse';
    if (lower === 'supervisor') badgeClass = 'badge-supervisor';
    return <span className={`badge ${badgeClass}`}>{role}</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REGISTERED':
        return (
          <span className="badge status-registered">
            <ShieldCheck size={12} /> REGISTERED
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="badge status-unknown">
            <HelpCircle size={12} /> UNKNOWN
          </span>
        );
      case 'REVOKED':
        return (
          <span className="badge status-revoked">
            <Ban size={12} /> REVOKED
          </span>
        );
      case 'INVALID_DEVICE':
        return (
          <span className="badge status-invalid">
            <AlertCircle size={12} /> INVALID DEVICE
          </span>
        );
      default:
        return <span className="badge status-invalid">{status}</span>;
    }
  };

  return (
    <div className="table-card">
      <div className="table-header-box">
        <h3 className="section-title" style={{ fontSize: '1.1rem' }}>{title}</h3>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Real-time Event Stream ({events.length} records)
        </span>
      </div>

      <div className="table-responsive">
        <table id="access-event-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Staff</th>
              <th>Role</th>
              <th>Ward</th>
              <th>Bed</th>
              <th>Device</th>
              <th>Event</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No access events recorded yet. Tap an RFID badge to trigger an event.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.event_id || Math.random()}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                    {formatTimestamp(evt.timestamp)}
                  </td>
                  <td>
                    <strong style={{ color: evt.staff_name ? '#0f172a' : '#ef4444' }}>
                      {evt.staff_name || 'Unknown RFID'}
                    </strong>
                    {evt.rfid_uid && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        UID: {evt.rfid_uid}
                      </div>
                    )}
                  </td>
                  <td>{getRoleBadge(evt.role)}</td>
                  <td>{evt.ward_type === 'ICU' ? 'ICU' : 'General Ward'}</td>
                  <td>
                    <strong style={{ color: '#0284c7' }}>{evt.bed_zone_id}</strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      {evt.device_id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                      {evt.event_type || 'ACCESS_REQUEST'}
                    </span>
                  </td>
                  <td>{getStatusBadge(evt.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
