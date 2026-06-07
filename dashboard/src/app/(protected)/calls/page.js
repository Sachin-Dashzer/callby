'use client';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import CallTypeBadge from '../../../components/CallTypeBadge';
import Pagination from '../../../components/Pagination';

function formatDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function exportCSV(calls) {
  const headers = ['Employee', 'Contact Name', 'Contact Number', 'Call Type', 'Duration (s)', 'Timestamp'];
  const rows = calls.map((c) => [
    c.employeeName, c.contactName, c.contactNumber, c.callType, c.duration,
    new Date(c.timestamp).toLocaleString()
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calltrack_export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CallLogsPage() {
  const [calls, setCalls] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ employeeId: '', callType: '', startDate: '', endDate: '' });

  const fetchCalls = async (p = page) => {
    try {
      const params = { page: p, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get('/api/calls', { params });
      setCalls(res.data.data.calls);
      setTotal(res.data.data.total);
      setPages(res.data.data.pages);
    } catch {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data.data);
    } catch {}
  };

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchCalls(); }, [page]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCalls(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Call Logs <span className="text-gray-500 text-sm font-normal">({total} total)</span></h2>
        <button onClick={() => exportCSV(calls)} className="bg-card border border-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg hover:bg-navy transition-colors">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-card rounded-xl p-4 border border-navy flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Employee</label>
          <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent">
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Call Type</label>
          <select value={filters.callType} onChange={(e) => setFilters({ ...filters, callType: e.target.value })}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent">
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
        <button type="submit" className="bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600">Apply</button>
        <button type="button" onClick={() => { setFilters({ employeeId: '', callType: '', startDate: '', endDate: '' }); setPage(1); }}
          className="border border-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg hover:bg-navy">Reset</button>
      </form>

      <div className="bg-card rounded-xl border border-navy overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy text-gray-400 uppercase text-xs">
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((log) => (
              <tr key={log._id} className="border-b border-navy hover:bg-navy/40">
                <td className="px-4 py-3 text-gray-300">{log.employeeName}</td>
                <td className="px-4 py-3">
                  <p className="text-white">{log.contactName}</p>
                  <p className="text-gray-500 text-xs">{log.contactNumber}</p>
                </td>
                <td className="px-4 py-3"><CallTypeBadge type={log.callType} /></td>
                <td className="px-4 py-3 text-gray-300">{formatDuration(log.duration)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No call logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}
