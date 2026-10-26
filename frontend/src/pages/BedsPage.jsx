import React, { useState, useEffect } from 'react';
import { Plus, Bed, Wifi, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export default function BedsPage() {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [wardType, setWardType] = useState('ICU');
  const [wardName, setWardName] = useState('ICU');
  const [bedNumber, setBedNumber] = useState('');
  const [bedZoneId, setBedZoneId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('ONLINE');

  const loadBeds = async () => {
    setLoading(true);
    try {
      const res = await api.getBedZones('ALL');
      setBeds(res.data || []);
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, []);

  const handleWardTypeChange = (type) => {
    setWardType(type);
    setWardName(type === 'ICU' ? 'ICU' : 'General Ward');
    if (bedNumber) {
      const prefix = type === 'ICU' ? 'ICU' : 'GW';
      setBedZoneId(`${prefix}-${bedNumber.padStart(2, '0')}`);
      setDeviceId(`ESP32-${prefix}-${bedNumber.padStart(2, '0')}`);
    }
  };

  const handleBedNumberChange = (num) => {
    setBedNumber(num);
    const prefix = wardType === 'ICU' ? 'ICU' : 'GW';
    if (num) {
      setBedZoneId(`${prefix}-${num.padStart(2, '0')}`);
      setDeviceId(`ESP32-${prefix}-${num.padStart(2, '0')}`);
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.createBedZone({
        bed_zone_id: bedZoneId,
        ward_type: wardType,
        ward_name: wardName,
        bed_number: bedNumber,
        device_id: deviceId,
        status
      });
      setShowModal(false);
      setBedNumber('');
      setBedZoneId('');
      setDeviceId('');
      loadBeds();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create bed zone');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Bed / Zone Management</h2>
          <p>Configure hospital beds and their fixed 1-to-1 ESP32 RFID controller mappings</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={loadBeds} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button id="btn-add-bed" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Bed Zone
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-box">
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Configured Bed Zones</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Zones: {beds.length}
          </span>
        </div>

        <div className="table-responsive">
          <table id="beds-table">
            <thead>
              <tr>
                <th>Bed Zone ID</th>
                <th>Ward Type</th>
                <th>Ward Name</th>
                <th>Bed Number</th>
                <th>Associated Device</th>
                <th>Last Active Staff</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {beds.map((b) => (
                <tr key={b.bed_zone_id}>
                  <td>
                    <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>{b.bed_zone_id}</strong>
                  </td>
                  <td>
                    <span className="bed-ward-pill">
                      {b.ward_type === 'ICU' ? 'ICU' : 'General Ward'}
                    </span>
                  </td>
                  <td>{b.ward_name}</td>
                  <td style={{ fontWeight: 600 }}>{b.bed_number}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      {b.device_id}
                    </span>
                  </td>
                  <td>
                    {b.last_staff_name ? (
                      <div>
                        <strong>{b.last_staff_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {b.last_role} · {new Date(b.last_access_time).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${b.status === 'ONLINE' ? 'status-registered' : 'status-unknown'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bed Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Hospital Bed Zone</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddBed}>
              <div className="modal-body">
                {errorMessage && (
                  <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="ward_type">Ward Type</label>
                  <select
                    id="ward_type"
                    className="form-control"
                    value={wardType}
                    onChange={(e) => handleWardTypeChange(e.target.value)}
                  >
                    <option value="ICU">ICU (Intensive Care Unit)</option>
                    <option value="GENERAL_WARD">GENERAL WARD</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ward_name">Ward Name</label>
                  <input
                    id="ward_name"
                    type="text"
                    className="form-control"
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bed_number">Bed Number</label>
                  <input
                    id="bed_number"
                    type="text"
                    className="form-control"
                    placeholder="e.g. 04"
                    value={bedNumber}
                    onChange={(e) => handleBedNumberChange(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bed_zone_id">Bed Zone ID</label>
                  <input
                    id="bed_zone_id"
                    type="text"
                    className="form-control"
                    value={bedZoneId}
                    onChange={(e) => setBedZoneId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="device_id">Device ID (ESP32 Node)</label>
                  <input
                    id="device_id"
                    type="text"
                    className="form-control"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bed_status">Initial Status</label>
                  <select
                    id="bed_status"
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button id="btn-save-bed" type="submit" className="btn btn-primary">
                  Save Bed Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
