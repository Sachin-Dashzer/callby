'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/employees', label: 'Employees', icon: '👥' },
  { href: '/calls', label: 'Call Logs', icon: '📞' },
  { href: '/leads', label: 'Leads', icon: '🎯' }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-navy flex flex-col py-6 px-4 fixed left-0 top-0 z-10">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-accent">CallTrack</h1>
        <p className="text-gray-400 text-xs mt-1">Call Monitoring System</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-accent text-white font-medium'
                  : 'text-gray-300 hover:bg-card hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 text-xs text-gray-500 mt-4">v1.0.0</div>
    </aside>
  );
}
