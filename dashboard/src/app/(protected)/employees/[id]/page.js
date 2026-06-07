'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../lib/api';
import CallTypeBadge from '../../../../components/CallTypeBadge';
import Pagination from '../../../../components/Pagination';
import StatCard from '../../../../components/StatCard';

function formatDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ callType: '', startDate: '', endDate: '' });

  const fetchData = async (p = page) => {
    try {
      const params = { page: p, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const [empRes, callRes] = await Promise.all([
        api.get(`/api/employees/${id}`),
        api.get(`/api/calls/employee/${id}`, { params })
      ]);
      setEmployee(empRes.data.data);
      setData(callRes.data.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page, id]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <a href="/employees" className="text-gray-400 hover:text-white text-sm">← Employees</a>
        <span className="text-gray-600">/</span>
        <span className="text-white text-sm">{employee?.name || 'Employee Detail'}</span>
        {employee && <span className="text-gray-500 text-xs">({employee.email})</span>}
      </div>

      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Calls" value={data.stats.total} icon="📞" color="accent" />
          <StatCard title="Missed Calls" value={data.stats.missed} icon="📵" color="yellow" />
          <StatCard title="Avg Duration" value={formatDuration(data.stats.avgDuration)} icon="⏱" color="blue" />
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-card rounded-xl p-4 border border-navy flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Call Type</label>
          <select
            value={filters.callType}
            onChange={(e) => setFilters({ ...filters, callType: e.target.value })}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="">All Types</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
            <option value="missed">Missed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Start Date</label>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">End Date</label>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <button type="submit" className="bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600">
          Apply
        </button>
        <button type="button" onClick={() => { setFilters({ callType: '', startDate: '', endDate: '' }); setPage(1); }}
          className="border border-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg hover:bg-navy">
          Reset
        </button>
      </form>

      {/* Call logs table */}
      <div className="bg-card rounded-xl border border-navy overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy text-gray-400 uppercase text-xs">
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {(data?.calls || []).map((log) => (
              <tr key={log._id} className="border-b border-navy hover:bg-navy/40">
                <td className="px-4 py-3">
                  <p className="text-white">{log.contactName}</p>
                  <p className="text-gray-500 text-xs">{log.contactNumber}</p>
                </td>
                <td className="px-4 py-3"><CallTypeBadge type={log.callType} /></td>
                <td className="px-4 py-3 text-gray-300">{formatDuration(log.duration)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {(data?.calls || []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No call logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={data?.pages || 1} onPage={setPage} />
    </div>
  );
}
