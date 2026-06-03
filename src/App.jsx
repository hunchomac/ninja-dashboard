import { useState, useEffect } from 'react';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
  try {
    setLoading(true);
    
    // Step 1: Get auth token from NinjaRMM
    const tokenRes = await fetch('https://app.ninjarmm.com/ws/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: '7IQFEJQ2PMGQ7EADDF4F',
        client_secret: '64vrpjsa94vduos0f95k83tc81rpq370s1jd1tv1',
        scope: 'monitoring management'
      })
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // Step 2: Get devices using the token
    const deviceRes = await fetch('https://app.ninjarmm.com/v2/devices-detailed', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await deviceRes.json();
    setDevices(data.devices || []);
    setError(null);
  } catch (err) {
    setError('Failed to load devices: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 NinjaRMM Dashboard</h1>
        <button onClick={fetchDevices} className="refresh-btn">Refresh</button>
      </header>

      <main className="content">
        {loading && <p className="status">Loading devices...</p>}
        {error && <p className="error">{error}</p>}
        
        {!loading && !error && (
          <div className="stats">
            <div className="stat-card">
              <h3>Total Devices</h3>
              <p className="big-number">{devices.length}</p>
            </div>
          </div>
        )}

        {!loading && !error && devices.length > 0 && (
          <div className="devices-grid">
            {devices.map((device) => (
              <div key={device.id} className="device-card">
                <h3>{device.deviceName}</h3>
                <p><strong>Type:</strong> {device.deviceType}</p>
                <p><strong>Status:</strong> <span className={device.online ? 'online' : 'offline'}>
                  {device.online ? '🟢 Online' : '🔴 Offline'}
                </span></p>
                <p><strong>OS:</strong> {device.osVersion}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
