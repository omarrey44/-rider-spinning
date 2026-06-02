'use client';

import { useEffect, useState, useMemo } from 'react';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule, ColDef, themeQuartz } from 'ag-grid-community';
import AdminManualBookingModal from './AdminManualBookingModal';

const modules = [AllCommunityModule];

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  class_title: string;
  instructor_name: string;
  day: string;
  hour: string;
  class_date: string | null;
  bike_number: number;
  bike_row: number;
  amount_paid: number | null;
  status: string;
  confirmation_number: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmada', color: '#1b5e20', bg: '#e8f5e9' },
  pending:   { label: 'Pendiente',  color: '#e65100', bg: '#fff3e0' },
  cancelled: { label: 'Cancelada',  color: '#b71c1c', bg: '#ffebee' },
  refunded:  { label: 'Reembolsada',color: '#4a148c', bg: '#f3e5f5' },
};

function StatusCell({ value }: { value: string }) {
  const cfg = STATUS_MAP[value] ?? { label: value, color: '#555', bg: '#f5f5f5' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 14, fontSize: 12, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function ConfirmCell({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: '#bbb' }}>—</span>;
  return (
    <code style={{
      background: '#e0f7fa', color: '#00695c', padding: '3px 8px',
      borderRadius: 4, fontWeight: 700, fontSize: 11, letterSpacing: 1,
    }}>
      {value}
    </code>
  );
}

export default function AdminBookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar reservas');
      setBookings(data.bookings || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      todayConfirmed: bookings.filter(
        (b) => b.status === 'confirmed' && new Date(b.created_at).toDateString() === today
      ).length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_email.toLowerCase().includes(q) ||
          (b.confirmation_number ?? '').toLowerCase().includes(q) ||
          b.class_title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, statusFilter, search]);

  const colDefs: ColDef[] = [
    { field: 'confirmation_number', headerName: 'Confirm.', width: 120, cellRenderer: ({ value }: { value: string | null }) => <ConfirmCell value={value} /> },
    { field: 'customer_name',       headerName: 'Cliente',   width: 150 },
    { field: 'customer_email',      headerName: 'Email',     width: 200 },
    { field: 'status',              headerName: 'Estado',    width: 130, cellRenderer: ({ value }: { value: string }) => <StatusCell value={value} /> },
    {
      field: 'class_date',
      headerName: 'Fecha',
      width: 130,
      cellRenderer: ({ value }: { value: string | null }) =>
        value
          ? new Date(value + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
          : '—',
    },
    { field: 'instructor_name',     headerName: 'Instructor',width: 140 },
    { field: 'day',                 headerName: 'Día',       width: 110 },
    { field: 'hour',                headerName: 'Hora',      width: 110 },
    {
      field: 'bike_number',
      headerName: 'Bici',
      width: 110,
      cellRenderer: ({ data }: { data: Booking }) =>
        `#${String(data.bike_number).padStart(2, '0')} · F${data.bike_row}`,
    },
    {
      field: 'amount_paid',
      headerName: 'Monto',
      width: 140,
      cellRenderer: ({ value, data }: { value: number | null; data: Booking }) => {
        const sid: string = (data as any).stripe_session_id ?? '';
        if (sid.startsWith('admin:membership:')) return <span style={{ color: '#1565c0', fontWeight: 700, fontSize: 12 }}>Membresía</span>;
        if (sid.startsWith('admin:pack:'))        return <span style={{ color: '#6a1b9a', fontWeight: 700, fontSize: 12 }}>Pack 3 Horas</span>;
        if ((!value || value === 0) && !sid.startsWith('cs_')) return <span style={{ color: '#558b2f', fontWeight: 700, fontSize: 12 }}>Membresía / Pack</span>;
        return value != null ? `$${(value / 100).toLocaleString('es-MX')} MXN` : '—';
      },
    },
    {
      field: 'created_at',
      headerName: 'Registrada',
      width: 150,
      sort: 'desc',
      cellRenderer: ({ value }: { value: string }) =>
        new Date(value).toLocaleDateString('es-MX', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
    },
  ];

  if (error) {
    return (
      <div className="admin-error">
        <p>{error}</p>
        <button onClick={fetchBookings} className="btn btn-secondary">Reintentar</button>
      </div>
    );
  }

  return (
    <>
      <AdminManualBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { fetchBookings(); }}
      />

      {/* Stats bar */}
      <div className="admin-stats-bar">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.total}</span>
          <span className="admin-stat-label">Total</span>
        </div>
        <div className="admin-stat-card confirmed">
          <span className="admin-stat-value">{stats.confirmed}</span>
          <span className="admin-stat-label">Confirmadas</span>
        </div>
        <div className="admin-stat-card pending">
          <span className="admin-stat-value">{stats.pending}</span>
          <span className="admin-stat-label">Pendientes</span>
        </div>
        <div className="admin-stat-card today">
          <span className="admin-stat-value">{stats.todayConfirmed}</span>
          <span className="admin-stat-label">Hoy</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, email, confirmación…"
            className="admin-search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-status-filter"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <div className="admin-toolbar-right">
          <button className="btn btn-outline btn-sm" onClick={fetchBookings} disabled={loading}>
            {loading ? 'Cargando…' : '↻ Refrescar'}
          </button>
          <button
            className="btn btn-primary btn-sm admin-btn-cash"
            onClick={() => setModalOpen(true)}
          >
            + Reserva en efectivo
          </button>
        </div>
      </div>

      {/* Grid */}
      <AgGridProvider modules={modules}>
        <div className="ag-theme-quartz ag-theme-quartz-custom" style={{ width: '100%', height: 560 }}>
          <AgGridReact
            rowData={filteredBookings}
            columnDefs={colDefs}
            theme={themeQuartz}
            rowHeight={48}
            headerHeight={44}
            defaultColDef={{ resizable: true, sortable: true }}
            pagination
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            loading={loading}
          />
        </div>
      </AgGridProvider>

      <p className="admin-showing-label">
        Mostrando {filteredBookings.length} de {bookings.length} reservas
      </p>
    </>
  );
}
