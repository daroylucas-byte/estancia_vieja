import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate } from '@/utils/formatters';

export const TesoreriaPage: React.FC = () => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          compras!inner(
            id,
            numero_expediente,
            monto_total,
            solicitudes(titulo),
            proveedores(razon_social)
          )
        `)
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;
      setPagos(data || []);
    } catch (error: any) {
      console.error('Error fetching pagos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pendientes: pagos.filter(p => p.estado === 'pendiente').length,
    vencidos: pagos.filter(p => p.estado === 'pendiente' && new Date(p.fecha_vencimiento) < new Date()).length,
    totalPagado: pagos.filter(p => p.estado === 'pagado').reduce((acc, p) => acc + p.monto, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 font-h1 text-on-surface">Gestión de Tesorería</h1>
          <p className="text-body-md text-on-secondary-container mt-1">
            Supervise y registre los pagos de todas las compras autorizadas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Pagos Pendientes"
          value={stats.pendientes.toString()}
          variant="primary"
          icon="payments"
          badge="A LIQUIDAR"
        />
        <StatCard
          label="Vencidos / Urgentes"
          value={stats.vencidos.toString()}
          variant="error"
          icon="priority_high"
          badge="CRÍTICO"
        />
        <StatCard
          label="Total Liquidado"
          value={formatCurrency(stats.totalPagado)}
          variant="success"
          icon="verified"
          badge="ACUMULADO"
        />
      </div>

      <div className="bg-white border border-[#e0e4e8] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-[#e0e4e8]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Vencimiento</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Expediente / Proveedor</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Concepto</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Cuota</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e4e8]">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${p.estado === 'pendiente' && new Date(p.fecha_vencimiento) < new Date() ? 'text-error' : 'text-slate-900'}`}>
                        {formatDate(p.fecha_vencimiento)}
                      </span>
                      {p.estado === 'pagado' && p.fecha_pago_real && (
                        <span className="text-[10px] text-success font-black uppercase">Pagado el {formatDate(p.fecha_pago_real)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">{p.compras?.numero_expediente || 'S/N'}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{p.compras?.proveedores?.razon_social}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                    {p.compras?.solicitudes?.titulo}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-slate-500">Cuota {p.numero_cuota}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(p.monto)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={p.estado === 'pagado' ? 'success' : 'info'}>
                      {p.estado.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/solicitudes/${p.compras?.solicitudes?.id || ''}`} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[11px] uppercase hover:bg-primary/10 hover:text-primary transition-all">
                      Detalle
                    </a>
                  </td>
                </tr>
              ))}
              {pagos.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    No hay pagos registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
