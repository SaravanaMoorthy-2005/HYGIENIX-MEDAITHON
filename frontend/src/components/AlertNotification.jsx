import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export default function AlertNotification({ alerts = [], onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="live-toast-container">
      {alerts.map((alert) => {
        const isUnknown = alert.status === 'UNKNOWN';
        const isRevoked = alert.status === 'REVOKED';

        return (
          <div
            key={alert.id || alert.event_id}
            className={`live-toast ${isUnknown ? 'toast-unknown' : isRevoked ? 'toast-revoked' : 'toast-registered'}`}
          >
            {isUnknown ? (
              <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <ShieldAlert size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isUnknown ? '#991b1b' : '#9a3412' }}>
                {isUnknown ? 'Unknown RFID Card Detected' : 'Revoked RFID Card Detected'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                <div><strong>UID:</strong> <span style={{ fontFamily: 'monospace' }}>{alert.rfid_uid}</span></div>
                <div><strong>Bed Zone:</strong> {alert.bed_zone_id} · <strong>Device:</strong> {alert.device_id}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  Recorded at {new Date(alert.timestamp || Date.now()).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <button
              onClick={() => onDismiss(alert.id || alert.event_id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px'
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
