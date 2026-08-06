'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
  Search, RefreshCw, Plus, MoreVertical, CheckCircle2, Clock,
  XCircle, RotateCcw, Calendar, Users, TrendingUp, CalendarCheck,
  AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Bike,
} from 'lucide-react';
import { clsx } from 'clsx';
import AdminManualBookingModal from './AdminManualBookingModal';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
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
  stripe_session_id?: string;
}

const STATUS_CFG = {
  confirmed: { label: 'Confirmada', Icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  pending:   { label: 'Pendiente',  Icon: Clock,         cls: 'text-amber-700  bg-amber-50  border-amber-200'  },
  cancelled: { label: 'Cancelada',  Icon: XCircle,       cls: 'text-red-700   bg-red-50   border-red-200'   },
  refunded:  { label: 'Reembolsada',Icon: RotateCcw,     cls: 'text-purple-700 bg-purple-50 border-purple-200' },
  expired:   { label: 'Expirada',   Icon: Clock,         cls: 'text-gray-500  bg-gray-50  border-gray-200'  },
} as const;

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500',
  'bg-rose-500','bg-cyan-500','bg-orange-500','bg-pink-500',
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function MontoBadge({ amount, sessionId }: { amount: number | null; sessionId?: string }) {
  if (sessionId?.startsWith('admin:membership:'))
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Membresía</span>;
  if (sessionId?.startsWith('admin:pack:'))
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">Pack 3h</span>;
  if ((!amount || amount === 0) && !sessionId?.startsWith('cs_'))
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Membresía / Pack</span>;
  return <span className="text-sm font-semibold text-gray-900">${((amount ?? 0) / 100).toLocaleString('es-MX')} MXN</span>;
}

export default function AdminBookingsTable() {
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [menuId, setMenuId]         = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/bookings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings(data.bookings ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const today = useMemo(() => new Date().toDateString(), []);

  const stats = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    pending:   bookings.filter((b) => b.status === 'pending').length,
    today:     bookings.filter((b) => b.status === 'confirmed' && new Date(b.created_at).toDateString() === today).length,
  }), [bookings, today]);

  const filtered = useMemo(() => {
    let list = bookings;
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_email.toLowerCase().includes(q) ||
          (b.confirmation_number ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [bookings, statusFilter, search]);

  const columns: ColumnDef<Booking>[] = useMemo(() => [
    {
      id: 'confirmation_number',
      header: 'CONFIRMACIÓN',
      accessorKey: 'confirmation_number',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-mono font-bold tracking-widest">{v}</code>
          : <span className="text-gray-300">—</span>;
      },
    },
    {
      id: 'customer',
      header: 'CLIENTE',
      accessorKey: 'customer_name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', avatarColor(row.original.customer_name))}>
            {initials(row.original.customer_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{row.original.customer_name}</p>
            <p className="text-xs text-gray-400 truncate">{row.original.customer_email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'ESTADO',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const s = (getValue() as string) || 'pending';
        const cfg = STATUS_CFG[s as keyof typeof STATUS_CFG] ?? { label: s, Icon: AlertCircle, cls: 'text-gray-600 bg-gray-50 border-gray-200' };
        const Icon = cfg.Icon;
        return (
          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.cls)}>
            <Icon size={11} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: 'class_date',
      header: 'FECHA',
      accessorKey: 'class_date',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar size={13} className="text-gray-400 flex-shrink-0" />
            {new Date(v + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        ) : <span className="text-gray-300">—</span>;
      },
    },
    {
      id: 'instructor_name',
      header: 'INSTRUCTOR',
      accessorKey: 'instructor_name',
      cell: ({ getValue }) => {
        const name = getValue() as string;
        return (
          <div className="flex items-center gap-2">
            <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', avatarColor(name))}>
              {initials(name)}
            </div>
            <span className="text-sm text-gray-700 truncate">{name.split(' ')[0]} {name.split(' ')[1] ?? ''}</span>
          </div>
        );
      },
    },
    {
      id: 'day',
      header: 'DÍA',
      accessorKey: 'day',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue() as string}</span>,
    },
    {
      id: 'hour',
      header: 'HORA',
      accessorKey: 'hour',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={13} className="text-gray-400" />
          {getValue() as string}
        </div>
      ),
    },
    {
      id: 'bike',
      header: 'BICI',
      accessorKey: 'bike_number',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Bike size={13} className="text-gray-400" />
          #{String(row.original.bike_number).padStart(2, '0')} · F{row.original.bike_row}
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'MONTO',
      accessorKey: 'amount_paid',
      cell: ({ row }) => (
        <MontoBadge amount={row.original.amount_paid} sessionId={(row.original as any).stripe_session_id} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuId(menuId === row.original.id ? null : row.original.id); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={15} />
          </button>
          {menuId === row.original.id && (
            <div className="absolute right-0 top-8 z-50 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 text-sm">
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">Ver detalles</button>
              <div className="my-1 border-t border-gray-100" />
              <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">Cancelar reserva</button>
            </div>
          )}
        </div>
      ),
    },
  ], [menuId]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const statCards = [
    { label: 'Total Reservas', value: stats.total,     Icon: Users,         iconCls: 'text-blue-600',    bgCls: 'bg-blue-50'    },
    { label: 'Confirmadas',    value: stats.confirmed, Icon: CheckCircle2,  iconCls: 'text-emerald-600', bgCls: 'bg-emerald-50' },
    { label: 'Pendientes',     value: stats.pending,   Icon: Clock,         iconCls: 'text-amber-600',   bgCls: 'bg-amber-50'   },
    { label: 'Hoy',            value: stats.today,     Icon: CalendarCheck, iconCls: 'text-violet-600',  bgCls: 'bg-violet-50'  },
  ];

  return (
    <>
      <AdminManualBookingModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchBookings} />
      {menuId && <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={clsx('p-2 rounded-lg', card.bgCls)}>
                <card.Icon size={18} className={card.iconCls} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{card.value}</p>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{card.label}</p>
            {card.label === 'Confirmadas' && stats.confirmed > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-500" />
                <span className="text-xs text-emerald-600 font-semibold">Activas</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, email, confirmación..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-gray-600 transition-all"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 bg-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 text-sm px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={15} />
            Nueva Reserva
          </button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {error ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-400" size={28} />
            <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
            <button onClick={fetchBookings} className="text-sm text-blue-600 hover:underline">Reintentar</button>
          </div>
        ) : (
          <>
            {/* Desktop: tabla */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm border-collapse">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-gray-100 bg-gray-50/60">
                      {hg.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider whitespace-nowrap">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {columns.map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className={clsx('h-4 bg-gray-100 rounded-md animate-pulse', j === 1 ? 'w-32' : 'w-16')} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-16 text-gray-400 text-sm">
                        <Users size={28} className="mx-auto mb-3 text-gray-200" />
                        No se encontraron reservas
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors group"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3.5 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Móvil: lista de tarjetas (sin scroll horizontal) */}
            <div className="md:hidden divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  </div>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  <Users size={28} className="mx-auto mb-3 text-gray-200" />
                  No se encontraron reservas
                </div>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const b = row.original;
                  const cfg = STATUS_CFG[b.status as keyof typeof STATUS_CFG]
                    ?? { label: b.status, Icon: AlertCircle, cls: 'text-gray-600 bg-gray-50 border-gray-200' };
                  const StatusIcon = cfg.Icon;
                  return (
                    <div key={row.id} className="p-4">
                      {/* Cliente + estado */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', avatarColor(b.customer_name))}>
                            {initials(b.customer_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.customer_name}</p>
                            <p className="text-xs text-gray-400 truncate">{b.customer_email}</p>
                          </div>
                        </div>
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border flex-shrink-0', cfg.cls)}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Detalles en grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 pl-12">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                          {b.class_date
                            ? new Date(b.class_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                            : b.day}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-400 flex-shrink-0" />
                          {b.hour}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bike size={12} className="text-gray-400 flex-shrink-0" />
                          #{String(b.bike_number).padStart(2, '0')} · F{b.bike_row}
                        </div>
                        <div className="flex items-center gap-1.5 justify-self-start">
                          <MontoBadge amount={b.amount_paid} sessionId={b.stripe_session_id} />
                        </div>
                        {b.confirmation_number && (
                          <div className="col-span-2 flex items-center gap-1.5 pt-1">
                            <span className="text-gray-400">Confirmación:</span>
                            <code className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-mono font-bold tracking-widest">{b.confirmation_number}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Mostrando {filtered.length} de {bookings.length} reservas
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronsLeft size={14} className="text-gray-500" />
                </button>
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={14} className="text-gray-500" />
                </button>
                <span className="px-3 py-1.5 text-xs text-gray-600 font-medium bg-gray-50 rounded-lg border border-gray-100 min-w-[60px] text-center">
                  {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
                </span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronRight size={14} className="text-gray-500" />
                </button>
                <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronsRight size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
