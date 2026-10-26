import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import StaffPage from './pages/StaffPage';
import BedsPage from './pages/BedsPage';
import EventsPage from './pages/EventsPage';
import DeviceHealthPage from './pages/DeviceHealthPage';
import AlertNotification from './components/AlertNotification';
import { api } from './api/client';
import { initSocket, subscribeToEvent } from './api/socket';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isApiHealthy, setIsApiHealthy] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Core Data State
  const [summary, setSummary] = useState(null);
  const [beds, setBeds] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [wardFilter, setWardFilter] = useState('ALL');

  // Real-Time Alert Toasts (for UNKNOWN & REVOKED cards)
  const [alerts, setAlerts] = useState([]);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => (a.id || a.event_id) !== id));
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, bedsRes, eventsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getBedZones(wardFilter),
        api.getRecentAccessEvents(15)
      ]);

      setSummary(summaryRes.data);
      setBeds(bedsRes.data || []);
      setRecentEvents(eventsRes.data || []);
      setBackendError(null);
      setIsApiHealthy(true);
    } catch (err) {
      console.error('[App] Failed to fetch initial dashboard data:', err);
      setBackendError('Backend unavailable. Please check that the backend service is running.');
      setIsApiHealthy(false);
    }
  }, [wardFilter]);

  // Initial load & socket setup
  useEffect(() => {
    fetchData();

    // Setup Socket.IO
    initSocket((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to live access events
    const unsubAccess = subscribeToEvent('access_event', (eventData) => {
      console.log('[Live Event Received]:', eventData);

      // Prepend to recent events list
      setRecentEvents((prev) => [eventData, ...prev.slice(0, 19)]);

      // Check for UNKNOWN or REVOKED alert conditions
      if (eventData.status === 'UNKNOWN' || eventData.status === 'REVOKED') {
        setAlerts((prev) => [
          { ...eventData, id: `${eventData.event_id}-${Date.now()}` },
          ...prev.slice(0, 3)
        ]);
      }

      // Refresh summary statistics
      api.getDashboardSummary().then((res) => {
        if (res?.data) setSummary(res.data);
      }).catch(console.error);
    });

    // Subscribe to live bed status updates
    const unsubBed = subscribeToEvent('bed_update', (updatedBed) => {
      console.log('[Live Bed Update]:', updatedBed);
      setBeds((prev) =>
        prev.map((b) => (b.bed_zone_id === updatedBed.bed_zone_id ? updatedBed : b))
      );
    });

    // Fallback polling every 3 seconds if socket is disconnected
    const pollInterval = setInterval(() => {
      if (!isConnected) {
        fetchData();
      }
    }, 3000);

    return () => {
      unsubAccess();
      unsubBed();
      clearInterval(pollInterval);
    };
  }, [fetchData, isConnected]);

  // Re-fetch when ward filter changes
  useEffect(() => {
    api.getBedZones(wardFilter).then((res) => {
      if (res?.data) setBeds(res.data);
    }).catch(console.error);
  }, [wardFilter]);

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        isApiHealthy={isApiHealthy}
      />

      <main className="main-content">
        {backendError && (
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            <span>⚠️ {backendError}</span>
            <button className="btn btn-sm btn-outline" onClick={fetchData}>
              Retry Connection
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            beds={beds}
            events={recentEvents}
            filter={wardFilter}
            setFilter={setWardFilter}
            onRefreshData={fetchData}
          />
        )}

        {activeTab === 'staff' && <StaffPage />}

        {activeTab === 'beds' && <BedsPage />}

        {activeTab === 'events' && <EventsPage />}

        {activeTab === 'devices' && <DeviceHealthPage />}
      </main>

      <AlertNotification alerts={alerts} onDismiss={dismissAlert} />
    </div>
  );
}
