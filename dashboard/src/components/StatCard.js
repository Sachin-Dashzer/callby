export default function StatCard({ title, value, sub, icon, color = 'accent' }) {
  const colorMap = {
    accent: 'text-accent',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400'
  };
  return (
    <div className="bg-card rounded-xl p-5 flex items-center gap-4 border border-navy">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold ${colorMap[color] || 'text-white'}`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
