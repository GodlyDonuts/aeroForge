import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getMissionMetrics } from '../api';

function TelemetryCharts({ missionId, missionStatus }) {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!missionId || missionStatus?.status !== 'complete') {
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);

      try {
        const metrics = await getMissionMetrics(missionId);
        setTelemetry(metrics.telemetry);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [missionId, missionStatus]);

  const prepareChartData = () => {
    if (!telemetry || !telemetry.time || telemetry.time.length === 0) {
      return [];
    }

    const data = [];
    for (let i = 0; i < telemetry.time.length; i++) {
      data.push({
        time: telemetry.time[i].toFixed(2),
        x: telemetry.positions?.[i]?.[0]?.toFixed(3) || 0,
        y: telemetry.positions?.[i]?.[1]?.toFixed(3) || 0,
        z: telemetry.positions?.[i]?.[2]?.toFixed(3) || 0,
        vx: telemetry.velocities?.[i]?.[0]?.toFixed(3) || 0,
        vy: telemetry.velocities?.[i]?.[1]?.toFixed(3) || 0,
        vz: telemetry.velocities?.[i]?.[2]?.toFixed(3) || 0,
        energy: telemetry.energies?.[i]?.toFixed(3) || 0,
      });
    }

    return data;
  };

  const chartData = prepareChartData();

  return (
    <div className="panel-card">
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">📊</span>
          Telemetry Data
        </span>
        {telemetry && (
          <span style={{ fontSize: '11px', color: 'var(--accent-success)' }}>
            {telemetry.time?.length || 0} DATA POINTS
          </span>
        )}
      </div>
      <div className="panel-body">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}

        {!telemetry && !loading && (
          <div className="loading">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
              <div>Complete a mission to view telemetry</div>
            </div>
          </div>
        )}

        {telemetry && chartData.length > 0 && (
          <div style={{ height: '100%', overflow: 'auto' }}>
            {/* Position Chart */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Position Over Time
              </h4>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDash="3 3" stroke="#2a2a3a" />
                    <XAxis
                      dataKey="time"
                      stroke="#606070"
                      tick={{ fill: '#606070' }}
                      label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#606070' }}
                    />
                    <YAxis
                      stroke="#606070"
                      tick={{ fill: '#606070' }}
                      label={{ value: 'Position (m)', angle: -90, position: 'insideLeft', fill: '#606070' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a25',
                        border: '1px solid #2a2a3a',
                        borderRadius: '4px',
                        color: '#e0e0e0'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="x" stroke="#00d4ff" dot={false} name="X" strokeWidth={2} />
                    <Line type="monotone" dataKey="y" stroke="#7b2cbf" dot={false} name="Y" strokeWidth={2} />
                    <Line type="monotone" dataKey="z" stroke="#00ff88" dot={false} name="Z" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Velocity Chart */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Velocity Over Time
              </h4>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDash="3 3" stroke="#2a2a3a" />
                    <XAxis
                      dataKey="time"
                      stroke="#606070"
                      tick={{ fill: '#606070' }}
                      label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#606070' }}
                    />
                    <YAxis
                      stroke="#606070"
                      tick={{ fill: '#606070' }}
                      label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft', fill: '#606070' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a25',
                        border: '1px solid #2a2a3a',
                        borderRadius: '4px',
                        color: '#e0e0e0'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="vx" stroke="#ff4444" dot={false} name="Vx" strokeWidth={2} />
                    <Line type="monotone" dataKey="vy" stroke="#ffaa00" dot={false} name="Vy" strokeWidth={2} />
                    <Line type="monotone" dataKey="vz" stroke="#00ff88" dot={false} name="Vz" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Energy Chart */}
            <div>
              <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Total Energy Over Time
              </h4>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDash="3 3" stroke="#2a2a3a" />
                    <XAxis
                      dataKey="time"
                      stroke="#606070"
                      tick={{ fill: '#606070' }}
                      label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#606070' }}
                    />
                    <YAxis
                      stroke="#606070"
                      tick={{ fill: '#606070' }}
                      label={{ value: 'Energy (J)', angle: -90, position: 'insideLeft', fill: '#606070' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a25',
                        border: '1px solid #2a2a3a',
                        borderRadius: '4px',
                        color: '#e0e0e0'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="energy" stroke="#00d4ff" dot={false} name="Energy" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {telemetry && chartData.length === 0 && (
          <div className="loading">
            <div style={{ textAlign: 'center' }}>
              <div>No telemetry data available</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelemetryCharts;
