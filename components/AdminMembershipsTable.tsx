'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, RefreshCw, Ticket, Infinity as InfinityIcon, Banknote, CreditCard, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import { computeMaintenance, pesosFromCents } from '@/lib/maintenance';

interface Membership {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  type: 'pack' | 'subscription';
  credits_total: number | null;
  credits_used: number;
  expires_at: string;
  status: string;
  confirmation_number: string | null;
  amount_paid: number | null;
  stripe_session_id: string | null;
  created_at: string;
  maintenance_semester_start: string | null;
  maintenance_paid_cents: number | null;
  maintenance_exempt: boolean | null;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Vigencia real: 'expired' si ya venció, sin importar el status guardado.
function effectiveStatus(m: Membership): 'active' | 'expired' | 'cancelled' {
  if (m.status !== 'active') return 'cancelled';
  return new Date(m.expires_at) < new Date() ? 'expired' : 'active';
}

export default function AdminMembershipsTable() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [maintBusyId, setMaintBusyId] = useState<string | null>(null);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/memberships');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMemberships(data.memberships ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  // Registra el pago EN EFECTIVO de la cuota del semestre → quita el bloqueo.
  const markMaintenancePaid = useCallback(async (id: string) => {
    if (!confirm('¿Registrar la cuota de mantenimiento como pagada en efectivo? Esto quita el bloqueo de reservas.')) return;
    setMaintBusyId(id);
    try {
      const res = await fetch('/api/admin/memberships/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await fetchMemberships();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al registrar');
    } finally {
      setMaintBusyId(null);
    }
  }, [fetchMemberships]);

  // Exención permanente (paga siempre en efectivo): sin cobro/bloqueo/recordatorio.
  const toggleExempt = useCallback(async (id: string, exempt: boolean) => {
    if (!confirm(exempt
      ? '¿Exentar a este cliente de la cuota? No se le cobrará online, no se bloquea y no recibe recordatorios (paga en efectivo).'
      : '¿Quitar la exención? Volverá al cobro normal de la cuota.')) return;
    setMaintBusyId(id);
    try {
      const res = await fetch('/api/admin/memberships/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: id, exempt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await fetchMemberships();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setMaintBusyId(null);
    }
  }, [fetchMemberships]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memberships;
    return memberships.filter((m) =>
      m.customer_name?.toLowerCase().includes(q) ||
      m.customer_email?.toLowerCase().includes(q) ||
      (m.customer_phone ?? '').toLowerCase().includes(q) ||
      (m.confirmation_number ?? '').toLowerCase().includes(q)
    );
  }, [memberships, search]);

  const activeCount = useMemo(
    () => memberships.filter((m) => effectiveStatus(m) === 'active').length,
    [memberships],
  );

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-8">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Ticket size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Membresías y Packs</h2>
            <p className="text-xs text-gray-400">{activeCount} activas · {memberships.length} en total</p>
          </div>
        </div>
        <button
          onClick={fetchMemberships}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all font-medium"
        >
          <RefreshCw size={14} className={clsx(loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, correo, teléfono o nombre…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none"
          />
        </div>
      </div>

      {/* Body */}
      {error ? (
        <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          {search ? 'Sin resultados para esa búsqueda.' : 'Aún no hay membresías registradas.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((m) => {
            const st = effectiveStatus(m);
            const isPack = m.type === 'pack';
            const isCash = m.stripe_session_id?.startsWith('admin:cash:');
            const creditsLeft = isPack && m.credits_total !== null ? m.credits_total - m.credits_used : null;
            // Estado de la cuota de mantenimiento (solo suscripciones activas).
            const maint = !isPack && st === 'active'
              ? computeMaintenance(m.type, m.created_at, m.maintenance_semester_start, m.maintenance_paid_cents ?? 0, new Date(), m.maintenance_exempt ?? false)
              : null;
            return (
              <div key={m.id} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-violet-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials(m.customer_name || '?')}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.customer_email}{m.customer_phone ? ` · ${m.customer_phone}` : ''}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {isPack ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                      <Ticket size={12} /> Pack {m.credits_total}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <InfinityIcon size={12} /> Mensualidad
                    </span>
                  )}
                </div>

                {creditsLeft !== null && (
                  <span className="text-xs text-gray-500 font-medium w-20 text-center">
                    {creditsLeft}/{m.credits_total} créd.
                  </span>
                )}

                <code className="text-xs font-bold tracking-wide text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                  {m.confirmation_number ?? '—'}
                </code>

                <span className="inline-flex items-center gap-1 text-xs text-gray-400 w-24" title={isCash ? 'Efectivo' : 'Stripe'}>
                  {isCash ? <Banknote size={13} /> : <CreditCard size={13} />}
                  ${((m.amount_paid ?? 0) / 100).toLocaleString('es-MX')}
                </span>

                <span className="text-xs text-gray-400 w-28 text-right">Vence {fmtDate(m.expires_at)}</span>

                <span className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border w-20 justify-center',
                  st === 'active' && 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  st === 'expired' && 'text-gray-500 bg-gray-50 border-gray-200',
                  st === 'cancelled' && 'text-red-700 bg-red-50 border-red-200',
                )}>
                  {st === 'active' ? 'Activa' : st === 'expired' ? 'Expirada' : 'Cancelada'}
                </span>

                {/* Cuota de mantenimiento (suscripciones) */}
                {maint && (
                  <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                    {maint.exempt ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Wrench size={12} /> Exento · efectivo
                        </span>
                        <button
                          onClick={() => toggleExempt(m.id, false)}
                          disabled={maintBusyId === m.id}
                          className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium disabled:opacity-50"
                        >
                          {maintBusyId === m.id ? '…' : 'Quitar exención'}
                        </button>
                      </>
                    ) : (
                      <>
                        {maint.fullyPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Wrench size={12} /> Cuota pagada
                          </span>
                        ) : maint.owedCents > 0 ? (
                          <>
                            <span className={clsx(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border',
                              maint.blocked ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200',
                            )}>
                              <Wrench size={12} /> {maint.blocked ? 'Bloqueado' : 'Cuota'} {pesosFromCents(maint.owedCents)}
                            </span>
                            <button
                              onClick={() => markMaintenancePaid(m.id)}
                              disabled={maintBusyId === m.id}
                              className="text-xs px-2 py-1 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium disabled:opacity-50"
                            >
                              {maintBusyId === m.id ? '…' : 'Pagó en efectivo'}
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
                            <Wrench size={12} /> Cuota al día
                          </span>
                        )}
                        <button
                          onClick={() => toggleExempt(m.id, true)}
                          disabled={maintBusyId === m.id}
                          className="text-xs px-2 py-1 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium disabled:opacity-50"
                        >
                          Exentar
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
