import React from 'react';
import { Bed, User, Clock, Wifi } from 'lucide-react';

function formatTime(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

export default function BedZoneGrid({ beds = [], filter, setFilter }) {
  const filteredBeds = beds.filter((bed) => {
    if (filter === 'ALL') return true;
    return bed.ward_type === filter;
  });

  const icuBeds = filteredBeds.filter((b) => b.ward_type === 'ICU');
  const gwBeds = filteredBeds.filter((b) => b.ward_type === 'GENERAL_WARD');

  const renderBedCard = (bed) => {
    const isActive = Boolean(bed.last_staff_id && bed.status === 'ONLINE');
    const isOffline = bed.status === 'OFFLINE';

    return (
      <div 
        key={bed.bed_zone_id} 
        id={`bed-card-${bed.bed_zone_id}`}
        className={`bed-card ${isActive ? 'active-presence' : ''}`}
      >
        <div className="bed-card-header">
          <div>
            <span className="bed-id">{bed.bed_zone_id}</span>
            <span className="bed-ward-pill" style={{ marginLeft: '8px' }}>
              {bed.ward_type === 'ICU' ? 'ICU' : 'Gen Ward'}
            </span>
          </div>

          <span
            className={`bed-status-badge ${
              isOffline
                ? 'badge-offline'
                : isActive
                ? 'badge-active'
                : 'badge-available'
            }`}
          >
            {isOffline ? 'OFFLINE' : isActive ? 'ACTIVE' : 'AVAILABLE'}
          </span>
        </div>

        {isActive ? (
          <div className="bed-staff-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#0284c7" />
              <span className="staff-name">{bed.last_staff_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <span className="staff-role-badge">{bed.last_role || 'Healthcare Staff'}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {formatTime(bed.last_access_time) || 'Recently'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bed-staff-info" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
              No active staff badge presence
            </div>
          </div>
        )}

        <div className="bed-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wifi size={13} color={isOffline ? '#ef4444' : '#10b981'} />
            <span className="bed-device-code">{bed.device_id}</span>
          </span>
          <span>Bed #{bed.bed_number}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bed-zones-container">
      <div className="section-header">
        <h3 className="section-title">Live Bed / Zone Status</h3>

        <div className="filter-group">
          <button
            id="filter-all"
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            [ ALL ]
          </button>
          <button
            id="filter-icu"
            className={`filter-btn ${filter === 'ICU' ? 'active' : ''}`}
            onClick={() => setFilter('ICU')}
          >
            [ ICU ]
          </button>
          <button
            id="filter-gw"
            className={`filter-btn ${filter === 'GENERAL_WARD' ? 'active' : ''}`}
            onClick={() => setFilter('GENERAL_WARD')}
          >
            [ GENERAL WARD ]
          </button>
        </div>
      </div>

      {(filter === 'ALL' || filter === 'ICU') && icuBeds.length > 0 && (
        <div className="ward-section">
          <div className="ward-label">
            <Bed size={16} /> Intensive Care Unit (ICU)
          </div>
          <div className="beds-grid">
            {icuBeds.map(renderBedCard)}
          </div>
        </div>
      )}

      {(filter === 'ALL' || filter === 'GENERAL_WARD') && gwBeds.length > 0 && (
        <div className="ward-section">
          <div className="ward-label">
            <Bed size={16} /> General Ward (GW)
          </div>
          <div className="beds-grid">
            {gwBeds.map(renderBedCard)}
          </div>
        </div>
      )}

      {filteredBeds.length === 0 && (
        <div style={{ padding: '30px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          No bed zones found matching the selected ward filter.
        </div>
      )}
    </div>
  );
}
