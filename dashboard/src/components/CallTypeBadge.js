const config = {
  incoming: { label: 'Incoming', cls: 'bg-green-500/20 text-green-400' },
  outgoing: { label: 'Outgoing', cls: 'bg-blue-500/20 text-blue-400' },
  missed: { label: 'Missed', cls: 'bg-red-500/20 text-red-400' },
  rejected: { label: 'Rejected', cls: 'bg-yellow-500/20 text-yellow-400' }
};

export default function CallTypeBadge({ type }) {
  const { label, cls } = config[type] || { label: type, cls: 'bg-gray-500/20 text-gray-400' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
  );
}
