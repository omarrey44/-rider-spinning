'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminBookingsTable from '@/components/AdminBookingsTable';
import AdminMembershipsTable from '@/components/AdminMembershipsTable';
import { LogOut, LayoutDashboard } from 'lucide-react';

interface User { id: string; email: string }

export default function AdminDashboard() {
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/admin'); return; }
      setUser(user as User);
      setLoading(false);
    })();
  }, [router]);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Cargando…
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Panel de Reservas</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-medium hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
            >
              <LogOut size={15} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-2">
        <p className="text-sm text-gray-400 mb-1">¡Bienvenido de nuevo, {firstName}! 👋</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel de Reservas</h1>
        <p className="text-sm text-gray-400 mt-1">Gestiona todas las reservas y clientes desde aquí.</p>
      </div>

      {/* Content */}
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <AdminBookingsTable />
        <AdminMembershipsTable />
      </main>
    </div>
  );
}
