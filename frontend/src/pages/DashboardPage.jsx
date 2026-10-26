import React from 'react';
import SafetyBanner from '../components/SafetyBanner';
import MetricCards from '../components/MetricCards';
import RFIDSimulator from '../components/RFIDSimulator';
import BedZoneGrid from '../components/BedZoneGrid';
import AccessEventTable from '../components/AccessEventTable';

export default function DashboardPage({
  summary,
  beds,
  events,
  filter,
  setFilter,
  onRefreshData
}) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Clinical Bed-Zone Access Dashboard</h2>
          <p>Real-time healthcare staff identification & bed-presence monitoring (Module 1)</p>
        </div>
      </div>

      <SafetyBanner />

      <MetricCards summary={summary} />

      <RFIDSimulator onScanCompleted={onRefreshData} />

      <BedZoneGrid 
        beds={beds} 
        filter={filter} 
        setFilter={setFilter} 
      />

      <AccessEventTable 
        events={events} 
        title="Recent Bed-Zone Access Events" 
      />
    </div>
  );
}
