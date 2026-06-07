'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import Pagination from '@/components/Pagination';

const STATUSES = ['new', 'contacted', 'interested', 'not_interested', 'converted', 'lost'];

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', assignedTo: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: '', status: 'new', assignedTo: '', followUpDate: '' });
  const [loading, setLoading] = useState(false);

  const fetchLeads = async (p = page) => {
    try {
      const params = { page: p, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get('/api/leads', { params });
      setLeads(res.data.data.leads);
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
  useEffect(() => { fetchLeads(); }, [page]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/leads', form);
      toast.success('Lead created');
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', source: '', status: 'new', assignedTo: '', followUpDate: '' });
      fetchLeads(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/api/leads/${id}`, { status });
      toast.success('Status updated');
      fetchLeads();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/api/leads/${noteModal._id}/note`, { text: noteText });
      toast.success('Note added');
      setNoteModal(null);
      setNoteText('');
      fetchLeads();
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.delete(`/api/leads/${id}`);
      toast.success('Lead deleted');
      fetchLeads();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Leads <span className="text-gray-500 text-sm font-normal">({total})</span></h2>
        <button onClick={() => setShowAdd(true)} className="bg-accent hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border border-navy flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Status</label>
          <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Assigned To</label>
          <select value={filters.assignedTo} onChange={(e) => { setFilters({ ...filters, assignedTo: e.target.value }); setPage(1); }}
            className="bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent">
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <button onClick={() => { setFilters({ status: '', assignedTo: '' }); setPage(1); }}
          className="border border-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg hover:bg-navy">Reset</button>
      </div>

      <div className="bg-card rounded-xl border border-navy overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy text-gray-400 uppercase text-xs">
              <th className="px-4 py-3 text-left">Lead</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Assigned To</th>
              <th className="px-4 py-3 text-left">Notes</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="border-b border-navy hover:bg-navy/40">
                <td className="px-4 py-3">
                  <p className="text-white">{lead.name}</p>
                  <p className="text-gray-500 text-xs">{lead.source}</p>
                </td>
                <td className="px-4 py-3 text-gray-300">{lead.phone}</td>
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                    className="bg-navy border border-navy text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-accent"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">{lead.assignedTo?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{lead.notes?.length || 0} notes</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setNoteModal(lead)} className="text-xs text-blue-400 hover:underline">
                      + Note
                    </button>
                    <button onClick={() => handleDelete(lead._id)} className="text-xs text-red-400 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No leads found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} onPage={setPage} />

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-navy rounded-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Add New Lead</h3>
            <form onSubmit={handleAddLead} className="space-y-3">
              {[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'source', label: 'Source', type: 'text' }
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-gray-300 text-xs mb-1">{label}</label>
                  <input type={type} required={key !== 'email' && key !== 'source'} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-navy border border-navy rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-gray-300 text-xs mb-1">Assign To</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className="w-full bg-navy border border-navy text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent">
                  <option value="">Unassigned</option>
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-1">Follow-up Date</label>
                <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="w-full bg-navy border border-navy rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-lg text-sm hover:bg-navy">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-accent text-white py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-60">
                  {loading ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-navy rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-white font-semibold mb-2">Add Note — {noteModal.name}</h3>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Enter your note..."
              className="w-full bg-navy border border-navy rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent resize-none mb-3" />
            <div className="flex gap-3">
              <button onClick={() => { setNoteModal(null); setNoteText(''); }} className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-lg text-sm hover:bg-navy">Cancel</button>
              <button onClick={handleAddNote} className="flex-1 bg-accent text-white py-2 rounded-lg text-sm hover:bg-red-600">Add Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
