import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate } from '@/utils/formatters';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export const SolicitudesPage: React.FC = () => {
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSolicitudes();
  }, []);

  const { user: currentUser } = useAuthStore();

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('solicitudes')
        .select(`
          *,
          areas(nombre),
          usuarios!solicitante_id(nombre),
          presupuestos(id, estado),
          compras(
            id, 
            monto_total, 
            requiere_tribunal,
            aprobado_tribunal,
            pagos(id, fecha_vencimiento, estado, monto)
          )
        `);

      // Filtrado por ROL
      if (currentUser?.rol === 'area' && currentUser.area_id) {
        query = query.eq('area_id', currentUser.area_id);
      }
      
      if (currentUser?.rol === 'tribunal_cuentas') {
        // El tribunal solo ve lo que requiere tribunal
        // Nota: Esto es un filtro simplificado, idealmente se filtraría por el campo en la tabla compras join
        // Pero dado que compras es un join, el filtro se aplica después o mediante una vista.
        // Por ahora lo filtraremos en el cliente para asegurar UX si la query directa es compleja.
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      let finalData = data || [];
      
      // Filtro adicional en cliente para casos complejos de joins
      if (currentUser?.rol === 'tribunal_cuentas') {
        finalData = finalData.filter((s: any) => s.compras?.some((c: any) => c.requiere_tribunal));
      }

      setSolicitudes(finalData);
    } catch (error: any) {
      console.error('Error fetching solicitudes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEnhancedStatus = (exp: any) => {
    if (exp.estado === 'rechazada') return { label: 'RECHAZADA', color: 'error', icon: 'cancel' };
    if (exp.estado === 'pendiente_aprobacion_presupuestos') return { label: 'EVALUANDO', color: 'warning', icon: 'rule' };
    
    const hasPresupuestos = exp.presupuestos && exp.presupuestos.length > 0;
    const hasGanador = exp.presupuestos?.some((p: any) => p.estado === 'aprobado');
    const hasCompra = exp.compras && exp.compras.length > 0;
    const compra = exp.compras?.[0];
    const hasPagos = compra?.pagos && compra.pagos.length > 0;

    if (hasPagos) {
      const allPaid = compra.pagos.every((p: any) => p.estado === 'pagado');
      if (allPaid && compra.pagos.length > 0) return { label: 'FINALIZADA', color: 'success', icon: 'verified' };
      return { label: 'EN PAGOS', color: 'primary', icon: 'payments' };
    }

    if (hasCompra) {
      return { label: 'AUTORIZADA', color: 'primary', icon: 'gavel' };
    }

    if (hasGanador) {
      return { label: 'ADJUDICADA', color: 'secondary', icon: 'assignment_turned_in' };
    }
    
    if (hasPresupuestos) return { label: 'COTIZANDO', color: 'warning', icon: 'request_quote' };
    
    if (exp.estado === 'aprobada') {
      return { label: 'PARA COTIZAR', color: 'secondary', icon: 'hourglass_empty' };
    }
    
    return { label: 'PENDIENTE', color: 'slate-400', icon: 'pending' };
  };

  const stats = {
    pendientes: solicitudes.filter(s => getEnhancedStatus(s).label === 'PENDIENTE').length,
    enPresupuesto: solicitudes.filter(s => ['PARA COTIZAR', 'COTIZANDO'].includes(getEnhancedStatus(s).label)).length,
    aprobadas: solicitudes.filter(s => ['ADJUDICADA', 'AUTORIZADA', 'EN PAGOS', 'FINALIZADA'].includes(getEnhancedStatus(s).label)).length
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-h1 font-h1 text-on-surface">Listado de Expedientes</h1>
          <p className="text-body-md text-on-secondary-container mt-1">
            Gestione y supervise las solicitudes de compra de la administración central.
          </p>
        </div>
        {(currentUser?.rol === 'area' || currentUser?.rol === 'compras' || currentUser?.rol === 'admin') && (
          <Link to="/solicitudes/nueva">
            <Button size="lg" leftIcon="add_circle">
              NUEVA SOLICITUD
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label="Solicitudes Totales"
          value={solicitudes.length.toString()}
          variant="primary"
          icon="description"
          badge="TOTAL ACUMULADO"
        />
        <StatCard
          label="Pendientes de Presupuesto"
          value={stats.enPresupuesto.toString()}
          variant="warning"
          icon="request_quote"
          badge="REQUIERE ACCIÓN"
        />
        <StatCard
          label="Aprobadas / En Proceso"
          value={stats.aprobadas.toString()}
          variant="success"
          icon="check_circle"
          badge="FINALIZADO"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e0e4e8] p-6 rounded-xl flex flex-wrap items-center gap-6 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Área Emisora</label>
          <select className="w-full bg-slate-50 border border-[#e0e4e8] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
            <option>Todas las áreas</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Estado</label>
          <select className="w-full bg-slate-50 border border-[#e0e4e8] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
            <option>Todos los estados</option>
            <option>PENDIENTE</option>
            <option>COTIZANDO</option>
            <option>ADJUDICADA</option>
            <option>AUTORIZADA</option>
            <option>EN PAGOS</option>
            <option>FINALIZADA</option>
          </select>
        </div>
        <div className="flex-[1.5] min-w-[300px]">
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Buscador</label>
          <input 
            type="text" 
            placeholder="Buscar por expediente o concepto..."
            className="w-full bg-slate-50 border border-[#e0e4e8] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-[#e0e4e8] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-[#e0e4e8]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Alerta</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Expediente / Área</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Título / Descripción</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Monto Total</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Saldo Pendiente</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Próx. Venc.</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e4e8]">
              {solicitudes.map((exp) => {
                const status = getEnhancedStatus(exp);
                const compra = exp.compras?.[0];
                
                // Cálculo de saldo: Monto Total - (Suma de pagos con estado 'pagado')
                const totalPagado = compra?.pagos
                  ?.filter((p: any) => p.estado === 'pagado')
                  ?.reduce((acc: number, p: any) => acc + (p.monto || 0), 0) || 0;
                
                const saldo = compra ? (compra.monto_total - totalPagado) : (exp.monto_total || 0);
                
                // Buscar próximo vencimiento: el primer pago con estado 'pendiente'
                const proximaCuota = compra?.pagos
                  ?.filter((p: any) => p.estado !== 'pagado')
                  ?.sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];

                return (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <span className={`material-symbols-outlined text-${status.color === 'primary' ? 'blue-600' : (status.color === 'secondary' ? 'purple-600' : status.color)} text-[20px] ${status.label === 'PENDIENTE' ? 'animate-pulse' : ''}`}>
                        {status.icon}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{exp.numero_expediente || 'S/N'}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{exp.areas?.nombre || 'S/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 font-medium line-clamp-1">{exp.titulo}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(exp.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(compra?.monto_total || exp.monto_total || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${saldo > 0 ? 'text-error' : 'text-success'}`}>
                        {formatCurrency(saldo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {proximaCuota ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{formatDate(proximaCuota.fecha_vencimiento)}</span>
                          <span className="text-[10px] text-error font-black uppercase">Vencimiento</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin deuda</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={status.color as any}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/solicitudes/${exp.id}`}>
                        <button className="px-4 py-1.5 bg-secondary-container text-primary rounded-lg font-bold text-[11px] uppercase hover:bg-primary/10 transition-all">
                          Gestionar
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {solicitudes.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron expedientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#e0e4e8] flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">Mostrando {solicitudes.length} expedientes totales</p>
        </div>
      </div>

      {/* Decorative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative h-48 rounded-2xl overflow-hidden group shadow-md">
          <img
            alt="Guía de Procedimientos"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR31EDuKJ2DN-0Amm1gZT_XbK49i9-MuywQr1GnqtP2rHxArIdOToZ9TBbRUE9hWjqcBk2GEWXQb7PZMLxG1BMVf8CSMMrf269S4C4eNJe2ECwWUrNZEcPeaefn57hVpNNsr6cbqS-EmK5iwML8yxlk4kBaIdGMsVdPDLdbIwtTSxCwTTkdkLvEPOQjHKin5fRlvVwnA0Crx4ZT5oOCZRLJsE4VBxEFHIcmOGk_6sQ5jjVxME_X8xlxoUYNkvkP0sFcLwGLuESmxHg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-6">
            <h3 className="text-white font-black text-xl mb-1 italic">Guía de Procedimientos</h3>
            <p className="text-white/80 text-xs font-medium">Revise los últimos cambios en la normativa de contratación municipal.</p>
          </div>
        </div>
        <div className="bg-[#f0f4f8] rounded-2xl p-8 flex items-center justify-between border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <h3 className="font-black text-xl text-slate-800 italic">¿Necesita asistencia técnica?</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">support_agent</span>
              </div>
              <div>
                <p className="font-black text-sm text-slate-900">Soporte Interno IT</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Interno 4402 - 08:00 a 16:00 hs</p>
              </div>
            </div>
          </div>
          <Button variant="secondary" className="bg-white">CONTACTAR</Button>
        </div>
      </div>
    </div>
  );
};
