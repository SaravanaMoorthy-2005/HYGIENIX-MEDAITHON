import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import AccessEventTable from '../components/AccessEventTable';
import { api } from '../api/client';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getAccessEvents(wardFilter, statusFilter, 100);
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [wardFilter, statusFilter]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Access Events Audit Log</h2>
          <p>Complete historical ledger of RFID staff identification and bed access requests</p>
        </div>

        <button className="btn btn-outline" onClick={loadEvents} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ward:</span>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option value="ALL">All Wards</option>
            <option value="ICU">ICU</option>
            <option value="GENERAL_WARD">General Ward</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status:</span>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="UNKNOWN">UNKNOWN</option>
            <option value="REVOKED">REVOKED</option>
            <option value="INVALID_DEVICE">INVALID DEVICE</option>
          </select>
        </div>
      </div>

      <AccessEventTable events={events} title="Complete Audit Ledger" />
    </div>
  );
}
