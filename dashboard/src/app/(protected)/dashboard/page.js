'use client';
import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../../lib/api';
import StatCard from '../../../components/StatCard';
import CallTypeBadge from '../../../components/CallTypeBadge';

function formatDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const channelRef = useRef(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/calls/stats');
      setStats(res.data.data);
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    // Pusher real-time subscription (only if key is configured)
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return () => clearInterval(interval);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'
    });
    const channel = pusher.subscribe('managers');
    channelRef.current = channel;

    channel.bind('new_call_log', (data) => {
      setLiveFeed((prev) => [data, ...prev].slice(0, 20));
    });

    return () => {
      clearInterval(interval);
      channel.unbind_all();
      pusher.unsubscribe('managers');
      pusher.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Calls Today" value={stats?.totalToday ?? '—'} icon="📞" color="accent" />
        <StatCard title="Missed Calls" value={stats?.missedToday ?? '—'} icon="📵" color="yellow" />
        <StatCard title="Active Employees" value={stats?.activeEmployees ?? '—'} icon="👥" color="green" />
        <StatCard title="Avg Duration" value={stats ? formatDuration(stats.avgDuration) : '—'} icon="⏱" color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calls per hour chart */}
        <div className="xl:col-span-2 bg-card rounded-xl p-5 border border-navy">
          <h3 className="text-white font-medium mb-4">Calls Per Hour (Today)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.callsPerHour || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#16213e', border: '1px solid #1a1a2e', color: '#fff', fontSize: 12 }}
                labelFormatter={(h) => `${h}:00`}
              />
              <Bar dataKey="count" fill="#e94560" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top dialers */}
        <div className="bg-card rounded-xl p-5 border border-navy">
          <h3 className="text-white font-medium mb-4">Top Dialers Today</h3>
          {stats?.topDialers?.length === 0 && (
            <p className="text-gray-500 text-sm">No calls today yet</p>
          )}
          <div className="space-y-3">
            {(stats?.topDialers || []).map((d, i) => (
              <div key={d.employeeId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold text-sm w-5">#{i + 1}</span>
                  <span className="text-gray-300 text-sm">{d.employeeName}</span>
                </div>
                <span className="text-white font-semibold text-sm">{d.count} calls</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live call feed */}
      <div className="bg-card rounded-xl p-5 border border-navy">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Live Call Feed</h3>
          <span className="text-xs text-green-400 animate-pulse">● Real-time</span>
        </div>
        {liveFeed.length === 0 ? (
          <p className="text-gray-500 text-sm">Waiting for incoming call syncs...</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveFeed.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-navy text-sm">
                <div className="flex items-center gap-3">
                  <CallTypeBadge type={log.callType} />
                  <span className="text-gray-300">{log.employeeName}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-400">{log.contactNumber}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {log.duration ? formatDuration(log.duration) : '—'} &nbsp;
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
