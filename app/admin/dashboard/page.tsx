'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminBookingsTable from '@/components/AdminBookingsTable';

interface User {
  id: string;
  email: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin');
        return;
      }

      setUser(user as User);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
  };

  if (loading) {
    return <div className="admin-loading">Cargando…</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Panel de Administración</h1>
            <p className="admin-subtitle">Gestiona todas las reservas y clientes</p>
          </div>
          <div className="admin-user-info">
            <span className="admin-user-email">{user.email}</span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-logout"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <AdminBookingsTable />
      </main>
    </div>
  );
}
