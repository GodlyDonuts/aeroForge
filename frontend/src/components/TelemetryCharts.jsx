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
    <div className="glass-panel flex flex-col h-full bg-black">
      <div className="p-4 border-b border-spacex-border bg-spacex-bg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white">
              📊
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Telemetry Data</h2>
            </div>
          </div>
          {telemetry && (
            <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
              <span className="text-[10px] font-bold text-success uppercase tracking-wider">
                {telemetry.time?.length || 0} DATA POINTS
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-spacex-text-dim text-xs font-mono uppercase tracking-wider animate-pulse">
              LOADING TELEMETRY...
            </div>
          </div>
        )}

        {!telemetry && !loading && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-2xl text-spacex-text-dim mb-2">📈</div>
              <div className="text-xs text-spacex-text-dim uppercase tracking-wider">Awaiting Mission Data</div>
            </div>
          </div>
        )}

        {telemetry && chartData.length > 0 && (
          <div className="space-y-6">
            {/* Position Chart */}
            <div className="h-[200px] w-full">
              <h4 className="text-[10px] text-spacex-text-dim font-bold uppercase tracking-wider mb-2">
                Position Over Time
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDash="3 3" stroke="#333" />
                  <XAxis
                    dataKey="time"
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickLine={{ stroke: '#555' }}
                  />
                  <YAxis
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickLine={{ stroke: '#555' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      border: '1px solid #333',
                      borderRadius: '0px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#888' }}
                  />
                  <Legend iconType="rect" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="x" stroke="#fff" dot={false} name="X" strokeWidth={1.5} activeDot={{ r: 4, fill: '#fff' }} />
                  <Line type="monotone" dataKey="y" stroke="#888" dot={false} name="Y" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="z" stroke="#444" dot={false} name="Z" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Velocity Chart */}
            <div className="h-[200px] w-full">
              <h4 className="text-[10px] text-spacex-text-dim font-bold uppercase tracking-wider mb-2">
                Velocity Over Time
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDash="3 3" stroke="#333" />
                  <XAxis
                    dataKey="time"
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      border: '1px solid #333',
                      borderRadius: '0px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Legend iconType="rect" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="vx" stroke="#ff3b30" dot={false} name="Vx" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="vy" stroke="#ff9500" dot={false} name="Vy" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="vz" stroke="#34c759" dot={false} name="Vz" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Energy Chart */}
            <div className="h-[200px] w-full">
              <h4 className="text-[10px] text-spacex-text-dim font-bold uppercase tracking-wider mb-2">
                Total Energy Over Time
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDash="3 3" stroke="#333" />
                  <XAxis
                    dataKey="time"
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      border: '1px solid #333',
                      borderRadius: '0px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Legend iconType="rect" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="energy" stroke="#30b0c7" dot={false} name="Energy" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {telemetry && chartData.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-spacex-text-dim text-xs uppercase tracking-wider">
              No telemetry data available
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelemetryCharts;
