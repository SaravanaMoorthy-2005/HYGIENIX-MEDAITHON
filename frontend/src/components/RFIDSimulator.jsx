import React, { useState } from 'react';
import { Radio, Zap, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

export default function RFIDSimulator({ onScanCompleted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Custom Form State
  const [customUid, setCustomUid] = useState('A1B2C3D4');
  const [customBed, setCustomBed] = useState('ICU-01');
  const [customDevice, setCustomDevice] = useState('ESP32-ICU-01');

  const presetCards = [
    {
      label: 'Dr. Arun Kumar (Doctor)',
      uid: 'A1B2C3D4',
      bed: 'ICU-01',
      device: 'ESP32-ICU-01',
      type: 'registered'
    },
    {
      label: 'Nurse Priya (Nurse)',
      uid: 'B1C2D3E4',
      bed: 'ICU-03',
      device: 'ESP32-ICU-03',
      type: 'registered'
    },
    {
      label: 'Dr. Ravi (Doctor)',
      uid: 'C1D2E3F4',
      bed: 'GW-01',
      device: 'ESP32-GW-01',
      type: 'registered'
    },
    {
      label: 'Nurse Meena (Nurse)',
      uid: 'D1E2F3A4',
      bed: 'GW-02',
      device: 'ESP32-GW-02',
      type: 'registered'
    },
    {
      label: 'Unknown Card (Demo)',
      uid: '99887766',
      bed: 'ICU-02',
      device: 'ESP32-ICU-02',
      type: 'unknown'
    },
    {
      label: 'Revoked Card (Dr. Sarah)',
      uid: 'REV00112',
      bed: 'ICU-03',
      device: 'ESP32-ICU-03',
      type: 'revoked'
    }
  ];

  const handleSimulate = async (card) => {
    setLoading(true);
    try {
      const res = await api.simulateScan({
        device_id: card.device,
        bed_zone_id: card.bed,
        rfid_uid: card.uid,
        event_type: 'ACCESS_REQUEST'
      });
      setLastResult({ success: true, data: res, card });
      if (onScanCompleted) onScanCompleted();
    } catch (err) {
      setLastResult({ success: false, error: err.message, card });
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleTap = async (card) => {
    // First tap
    await handleSimulate(card);
    // Immediate second tap (within 300ms)
    setTimeout(() => {
      handleSimulate(card);
    }, 300);
  };

  return (
    <div className="simulator-panel">
      <div className="simulator-header">
        <h4 style={{ margin: 0 }}>
          <Radio size={18} color="#0284c7" />
          Interactive RFID Reader Simulator & Quick-Tester
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 'Collapse Panel' : 'Expand Simulator'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
        Click any preset badge below to simulate a real ESP32 + RC522 HTTP POST event to <code style={{ color: '#0284c7' }}>/api/rfid/scan</code>. Works seamlessly alongside physical ESP32 hardware!
      </p>

      {/* Preset Badges */}
      <div className="card-chips">
        {presetCards.map((c) => (
          <button
            key={c.uid + c.bed}
            className="card-chip-btn"
            disabled={loading}
            onClick={() => handleSimulate(c)}
          >
            <Zap size={14} color={c.type === 'unknown' ? '#dc2626' : c.type === 'revoked' ? '#d97706' : '#16a34a'} />
            <span>{c.label}</span>
            <span className="badge-code">{c.uid}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({c.bed})</span>
          </button>
        ))}

        <button
          className="card-chip-btn"
          style={{ borderColor: '#f59e0b', background: '#fffbeb' }}
          disabled={loading}
          onClick={() => handleDoubleTap(presetCards[0])}
        >
          <RefreshCw size={14} color="#d97706" />
          <span>Double-Tap Test (Debounce Cooldown)</span>
        </button>
      </div>

      {isOpen && (
        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
            Custom RFID Scan Dispatcher
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                RFID UID (Hex)
              </label>
              <input
                type="text"
                className="form-control"
                value={customUid}
                onChange={(e) => setCustomUid(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Bed Zone ID
              </label>
              <input
                type="text"
                className="form-control"
                value={customBed}
                onChange={(e) => setCustomBed(e.target.value)}
                placeholder="e.g. ICU-01"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Device ID
              </label>
              <input
                type="text"
                className="form-control"
                value={customDevice}
                onChange={(e) => setCustomDevice(e.target.value)}
                placeholder="e.g. ESP32-ICU-01"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
                onClick={() => handleSimulate({ uid: customUid, bed: customBed, device: customDevice })}
              >
                <Send size={14} /> Send Scan POST
              </button>
            </div>
          </div>
        </div>
      )}

      {lastResult && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            backgroundColor: lastResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${lastResult.success ? '#bbf7d0' : '#fecaca'}`,
            color: lastResult.success ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <strong>HTTP {lastResult.data?.status || 'RESPONSE'}:</strong> {lastResult.data?.message || lastResult.error} 
            {lastResult.data?.staff && ` — Identified: ${lastResult.data.staff.name} (${lastResult.data.staff.role})`}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
