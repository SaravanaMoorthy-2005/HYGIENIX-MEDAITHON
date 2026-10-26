import React from 'react';
import { 
  Activity, 
  Users, 
  Bed, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  Radio
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isConnected }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'beds', label: 'Beds / Zones', icon: Bed },
    { id: 'events', label: 'Access Events', icon: Clock },
    { id: 'devices', label: 'Device Health', icon: Cpu }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={24} />
        </div>
        <div className="brand-text">
          <h1>Smart Hand-Hygiene</h1>
          <p>General Ward + ICU</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="connection-indicator">
          <span className={`pulse-dot ${isConnected ? '' : 'offline'}`} />
          <span>{isConnected ? 'Gateway Connected (Live)' : 'Reconnecting...'}</span>
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748b' }}>
          Module 1: Staff RFID & Bed-Zone
        </div>
      </div>
    </aside>
  );
}
