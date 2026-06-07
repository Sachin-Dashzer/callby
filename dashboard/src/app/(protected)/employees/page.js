'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [callStats, setCallStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const [empRes, statsRes] = await Promise.all([
        api.get('/api/employees'),
        api.get('/api/calls/stats')
      ]);
      setEmployees(empRes.data.data);
      const dialerMap = {};
      (statsRes.data.data.topDialers || []).forEach((d) => {
        dialerMap[d.employeeId] = d.count;
      });
      setCallStats(dialerMap);
    } catch {}
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/employees', form);
      toast.success('Employee added');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Employees</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Add Employee
        </button>
      </div>

      <div className="bg-card rounded-xl border border-navy overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy text-gray-400 uppercase text-xs">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Calls Today</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} className="border-b border-navy hover:bg-navy/40 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{emp.name}</p>
                    <p className="text-gray-500 text-xs">{emp.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">{emp.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-300">{callStats[emp._id] || 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${emp.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/employees/${emp._id}`} className="text-accent hover:underline text-xs">
                    View Details →
                  </Link>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No employees found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-navy rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-semibold mb-4">Add New Employee</h3>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                { key: 'phone', label: 'Phone', type: 'text', placeholder: '+91 9999999999' }
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-gray-300 text-xs mb-1">{label}</label>
                  <input
                    type={type}
                    required={key !== 'phone'}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-navy border border-navy rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-lg text-sm hover:bg-navy">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-accent text-white py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-60">
                  {loading ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
