import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, Activity, Heart, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export default function DeviceHealthPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pulsingDevice, setPulsingDevice] = useState(null);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await api.getDevices();
      setDevices(res.data || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerHeartbeat = async (deviceId) => {
    setPulsingDevice(deviceId);
    try {
      await api.sendHeartbeat(deviceId, 'ONLINE');
      loadDevices();
    } catch (err) {
      alert(`Failed to send heartbeat: ${err.message}`);
    } finally {
      setTimeout(() => setPulsingDevice(null), 1000);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>ESP32 Device Health & Heartbeat Monitor</h2>
          <p>Real-time telemetry and connectivity tracking for hospital bed RFID nodes</p>
        </div>

        <button className="btn btn-outline" onClick={loadDevices} disabled={loading}>
          <RefreshCw size={15} /> Refresh Health
        </button>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Deployed Nodes</h3>
            <div className="metric-value">{devices.length}</div>
            <span className="metric-badge metric-blue">ESP32 DevKits</span>
          </div>
          <div className="metric-icon-box metric-blue">
            <Cpu size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Online Nodes</h3>
            <div className="metric-value">
              {devices.filter((d) => d.current_health_status === 'ONLINE').length}
            </div>
            <span className="metric-badge metric-green">Active Telemetry</span>
          </div>
          <div className="metric-icon-box metric-green">
            <Wifi size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Offline Nodes</h3>
            <div className="metric-value">
              {devices.filter((d) => d.current_health_status !== 'ONLINE').length}
            </div>
            <span className="metric-badge metric-red">Connection Alert</span>
          </div>
          <div className="metric-icon-box metric-red">
            <Activity size={24} />
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-box">
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>ESP32 Hardware Nodes Status</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Periodic Heartbeat: Every 30-60s
          </span>
        </div>

        <div className="table-responsive">
          <table id="device-health-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Assigned Bed</th>
                <th>Ward</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => {
                const isOnline = d.current_health_status === 'ONLINE';
                const isPulsing = pulsingDevice === d.device_id;

                return (
                  <tr key={d.device_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`pulse-dot ${isOnline ? '' : 'offline'}`} />
                        <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{d.device_id}</strong>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0284c7' }}>{d.bed_zone_id}</strong>
                    </td>
                    <td>{d.ward_type === 'ICU' ? 'ICU' : 'General Ward'}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569' }}>
                        {d.device_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isOnline ? 'status-registered' : 'status-unknown'}`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                      {d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : 'Never'}
                    </td>
                    <td>
                      <button
                        id={`btn-ping-${d.device_id}`}
                        className="btn btn-outline btn-sm"
                        onClick={() => handleTriggerHeartbeat(d.device_id)}
                        disabled={isPulsing}
                        title="Simulate hardware heartbeat POST /api/device/heartbeat"
                      >
                        <Heart size={13} color={isPulsing ? '#ef4444' : '#0284c7'} fill={isPulsing ? '#ef4444' : 'none'} />
                        {isPulsing ? 'Pinging...' : 'Send Heartbeat'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
