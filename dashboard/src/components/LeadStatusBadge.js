const config = {
  new: { label: 'New', cls: 'bg-blue-500/20 text-blue-400' },
  contacted: { label: 'Contacted', cls: 'bg-purple-500/20 text-purple-400' },
  interested: { label: 'Interested', cls: 'bg-yellow-500/20 text-yellow-400' },
  not_interested: { label: 'Not Interested', cls: 'bg-red-500/20 text-red-400' },
  converted: { label: 'Converted', cls: 'bg-green-500/20 text-green-400' },
  lost: { label: 'Lost', cls: 'bg-gray-500/20 text-gray-400' }
};

export default function LeadStatusBadge({ status }) {
  const { label, cls } = config[status] || { label: status, cls: 'bg-gray-500/20 text-gray-400' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
  );
}
