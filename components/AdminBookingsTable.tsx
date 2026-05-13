'use client';

import { useEffect, useState } from 'react';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule, ColDef, themeQuartz } from 'ag-grid-community';

const modules = [AllCommunityModule];

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
}

export default function AdminBookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar reservas');
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const statusRenderer = (params: any) => {
    const status = params.value;
    const statusMap: Record<string, { label: string; color: string }> = {
      confirmed: { label: 'Confirmada', color: '#2e7d32' },
      pending: { label: 'Pendiente', color: '#f57c00' },
      cancelled: { label: 'Cancelada', color: '#d32f2f' },
      refunded: { label: 'Reembolsada', color: '#7b1fa2' },
    };

    const config = statusMap[status] || { label: status, color: '#666' };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '18px',
        backgroundColor: `${config.color}20`,
        color: config.color,
        fontWeight: 700,
        fontSize: '13px',
        height: '100%',
        width: 'fit-content',
      }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: config.color, flexShrink: 0 }}></span>
        {config.label}
      </div>
    );
  };

  const dateRenderer = (params: any) => {
    if (!params.value) return '—';
    return new Date(params.value).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const bikeRenderer = (params: any) => {
    return `#${String(params.data.bike_number).padStart(2, '0')} · Fila ${params.data.bike_row}`;
  };

  const confirmationRenderer = (params: any) => {
    return params.value ? (
      <code style={{
        backgroundColor: '#e0f2f1',
        color: '#00695c',
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '11px',
        fontFamily: 'monospace',
        letterSpacing: '1px',
      }}>
        {params.value}
      </code>
    ) : '—';
  };

  const amountRenderer = (params: any) => {
    const amount = params.value ? (params.value / 100) : 0;
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const createdAtRenderer = (params: any) => {
    return new Date(params.value).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const colDefs: ColDef[] = [
    {
      field: 'customer_name',
      headerName: 'Cliente',
      width: 140,
      sort: 'asc',
    },
    {
      field: 'customer_email',
      headerName: 'Email',
      width: 180,
    },
    {
      field: 'confirmation_number',
      headerName: 'Confirmación',
      width: 130,
      cellRenderer: confirmationRenderer,
    },
    {
      field: 'class_title',
      headerName: 'Clase',
      width: 140,
    },
    {
      field: 'instructor_name',
      headerName: 'Instructor',
      width: 150,
    },
    {
      field: 'hour',
      headerName: 'Horario',
      width: 100,
    },
    {
      field: 'bike_number',
      headerName: 'Bici',
      width: 120,
      cellRenderer: bikeRenderer,
    },
    {
      field: 'amount_paid',
      headerName: 'Monto',
      width: 100,
      cellRenderer: amountRenderer,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 130,
      cellRenderer: statusRenderer,
    },
    {
      field: 'created_at',
      headerName: 'Fecha Reserva',
      width: 160,
      cellRenderer: createdAtRenderer,
      sort: 'desc',
    },
  ];

  if (error) {
    return (
      <div className="admin-error">
        <p>{error}</p>
        <button onClick={fetchBookings} className="btn btn-secondary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <AgGridProvider modules={modules}>
      <section className="admin-bookings">
        <div className="ag-theme-quartz ag-theme-quartz-custom" style={{ width: '100%', height: '600px' }}>
          <AgGridReact
            rowData={bookings}
            columnDefs={colDefs}
            theme={themeQuartz}
            rowHeight={50}
            headerHeight={45}
            defaultColDef={{
              resizable: true,
              sortable: true,
            }}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            loading={loading}
          />
        </div>
      </section>
    </AgGridProvider>
  );
}
