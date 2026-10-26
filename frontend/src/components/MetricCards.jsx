import React from 'react';
import { Users, Bed, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MetricCards({ summary }) {
  const cards = [
    {
      id: 'metric-staff',
      title: 'Total Staff',
      value: summary?.total_staff ?? 0,
      badge: 'Active Roster',
      badgeClass: 'metric-blue',
      iconBoxClass: 'metric-blue',
      icon: Users
    },
    {
      id: 'metric-active-beds',
      title: 'Active Beds',
      value: `${summary?.active_beds ?? 0} / ${summary?.total_beds ?? 0}`,
      badge: `${summary?.breakdown?.icu_beds ?? 0} ICU · ${summary?.breakdown?.general_ward_beds ?? 0} GW`,
      badgeClass: 'metric-teal',
      iconBoxClass: 'metric-teal',
      icon: Bed
    },
    {
      id: 'metric-today-events',
      title: "Today's Access Events",
      value: summary?.today_access_events ?? 0,
      badge: 'Live Logged',
      badgeClass: 'metric-green',
      iconBoxClass: 'metric-green',
      icon: CheckCircle2
    },
    {
      id: 'metric-unknown-events',
      title: 'Unknown RFID Events',
      value: summary?.unknown_rfid_events ?? 0,
      badge: summary?.unknown_rfid_events > 0 ? 'Review Needed' : 'Zero Flags',
      badgeClass: summary?.unknown_rfid_events > 0 ? 'metric-red' : 'metric-amber',
      iconBoxClass: summary?.unknown_rfid_events > 0 ? 'metric-red' : 'metric-amber',
      icon: AlertTriangle
    }
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} id={card.id} className="metric-card">
            <div className="metric-info">
              <h3>{card.title}</h3>
              <div className="metric-value">{card.value}</div>
              <span className={`metric-badge ${card.badgeClass}`}>{card.badge}</span>
            </div>
            <div className={`metric-icon-box ${card.iconBoxClass}`}>
              <Icon size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
