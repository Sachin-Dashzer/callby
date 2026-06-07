'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '../lib/api';

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me').then((res) => setUser(res.data.data)).catch(() => {});
  }, []);

  const logout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <header className="h-14 bg-card border-b border-navy flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-10">
      <div className="text-sm text-gray-400">
        Welcome back, <span className="text-white font-medium">{user?.name || '...'}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">● Live</span>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-accent transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
