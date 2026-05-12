import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getColorEstadoSolicitud, getLabelEstado } from '@/utils/estados';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useAuthStore } from '@/stores/authStore';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({
    recentSolicitudes: [] as any[],
    stats: {
      totalDebt: 0,
      nextMonthDue: 0,
      totalSolicitudes: 0,
      activeProviders: 0
    },
    areaSpending: [] as any[],
    rubroSpending: [] as any[],
    monthlyProjection: [] as any[],
    urgentPayments: [] as any[]
  });

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const { user } = useAuthStore();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Solicitudes (filtrado por área si corresponde)
      let solsQuery = supabase
        .from('solicitudes')
        .select('*, areas(nombre), compras(monto_total)');
      
      if (user?.rol === 'area' && user.area_id) {
        solsQuery = solsQuery.eq('area_id', user.area_id);
      }

      const { data: sols, error: solsError } = await solsQuery.order('created_at', { ascending: false });
      if (solsError) throw solsError;

      // 2. Fetch Pagos (Solo si no es ROL area)
      let pagos: any[] = [];
      if (user?.rol !== 'area' && user?.rol !== 'tribunal_cuentas') {
        const { data: pagosData, error: pagosError } = await supabase
          .from('pagos')
          .select(`
            *,
            compras (
              monto_total,
              solicitudes (
                id,
                titulo,
                numero_expediente,
                areas (nombre)
              ),
              presupuestos!presupuesto_id (
                proveedores (razon_social)
              )
            )
          `)
          .eq('estado', 'pendiente')
          .order('fecha_vencimiento', { ascending: true });

        if (pagosError) throw pagosError;
        pagos = pagosData || [];
      }

      // 3. Fetch Compras con Rubros (Solo si no es ROL area)
      let comprasRubros: any[] = [];
      if (user?.rol !== 'area' && user?.rol !== 'tribunal_cuentas') {
        const { data: rubrosData, error: rubrosError } = await supabase
          .from('compras')
          .select(`
            monto_total,
            presupuestos!presupuesto_id (
              proveedores (
                razon_social,
                rubros_proveedores (nombre)
              )
            )
          `);

        if (rubrosError) throw rubrosError;
        comprasRubros = rubrosData || [];
      }

      // 4. Fetch Proveedores activos
      const { count: providersCount } = await supabase
        .from('proveedores')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // --- CÁLCULOS ---
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);

      let totalDebt = 0;
      let nextMonthDue = 0;
      const spendingByArea: Record<string, number> = {};
      const spendingByRubro: Record<string, number> = {};
      const monthlyProjection: Record<string, number> = {};
      const upcomingPayments: any[] = [];

      // Procesar Pagos Pendientes
      pagos?.forEach(p => {
        const monto = Number(p.monto);
        totalDebt += monto;
        
        const vcto = new Date(p.fecha_vencimiento);
        if (vcto <= nextMonth) {
          nextMonthDue += monto;
        }

        const monthYear = p.fecha_vencimiento.substring(0, 7);
        monthlyProjection[monthYear] = (monthlyProjection[monthYear] || 0) + monto;

        const areaNombre = p.compras?.solicitudes?.areas?.nombre || 'General';
        spendingByArea[areaNombre] = (spendingByArea[areaNombre] || 0) + monto;

        upcomingPayments.push({
          id: p.id,
          fecha: p.fecha_vencimiento,
          monto: p.monto,
          cuota: p.numero_cuota,
          proveedor: (p.compras as any)?.presupuestos?.proveedores?.razon_social || 'S/P',
          expediente: (p.compras as any)?.solicitudes?.numero_expediente || 'S/N',
          solicitud_id: (p.compras as any)?.solicitudes?.id,
          titulo: (p.compras as any)?.solicitudes?.titulo
        });
      });

      // Procesar Gasto por Rubro
      comprasRubros?.forEach(c => {
        const monto = Number(c.monto_total) || 0;
        const rubroNombre = (c.presupuestos as any)?.proveedores?.rubros_proveedores?.nombre || 'Sin Clasificar';
        spendingByRubro[rubroNombre] = (spendingByRubro[rubroNombre] || 0) + monto;
      });

      // Formatear para Recharts
      const areaChartData = Object.entries(spendingByArea).map(([name, value]) => ({ name, value }));
      const rubroChartData = Object.entries(spendingByRubro)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const projectionChartData = Object.entries(monthlyProjection)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => ({ name, value }))
        .slice(0, 6);

      setData({
        recentSolicitudes: (sols as any[])?.slice(0, 5).map(s => ({
          ...s,
          monto_total: s.compras?.[0]?.monto_total || 0
        })) || [],
        stats: {
          totalDebt,
          nextMonthDue,
          totalSolicitudes: (sols as any[])?.length || 0,
          activeProviders: providersCount || 0
        },
        areaSpending: areaChartData,
        rubroSpending: rubroChartData,
        monthlyProjection: projectionChartData,
        urgentPayments: upcomingPayments.slice(0, 8)
      });

    } catch (error: any) {
      console.error('Error dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard General</h2>
          <p className="text-slate-500 font-medium mt-1 italic">
            Resumen operativo y financiero de la gestión de compras.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/solicitudes/nueva">
            <Button size="lg" leftIcon="add_circle" className="shadow-lg shadow-primary/20">
              NUEVA SOLICITUD
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(user?.rol !== 'area' && user?.rol !== 'tribunal_cuentas') && (
          <>
            <StatCard 
              label="Deuda Total" 
              value={formatCurrency(data.stats.totalDebt)} 
              icon="account_balance_wallet" 
              badge="COMPROMETIDO"
              variant="primary"
            />
            <StatCard 
              label="Vence en 30 días" 
              value={formatCurrency(data.stats.nextMonthDue)} 
              icon="event_upcoming" 
              badge="PLAN DE CAJA" 
              variant="warning"
            />
          </>
        )}
        <StatCard 
          label="Solicitudes" 
          value={data.stats.totalSolicitudes.toString()} 
          icon="description" 
          badge="GESTIÓN" 
        />
        <StatCard 
          label="Proveedores" 
          value={data.stats.activeProviders.toString()} 
          icon="inventory_2" 
          badge="ACTIVOS" 
          variant="success"
        />
      </div>

      {/* Charts Section */}
      {(user?.rol !== 'area' && user?.rol !== 'tribunal_cuentas') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Fila superior: Áreas y Rubros */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">pie_chart</span>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gasto por Área</h3>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.areaSpending}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {data.areaSpending.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">category</span>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Distribución por Rubro</h3>
            </div>
            <div className="h-[320px] w-full">
              {data.rubroSpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.rubroSpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {data.rubroSpending.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic font-medium">
                  Sin datos de rubros registrados
                </div>
              )}
            </div>
          </div>

          {/* Fila inferior: Proyección */}
          <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-xl">query_stats</span>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Proyección de Pagos</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyProjection}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Cronograma de Pagos Section */}
      {(user?.rol !== 'area' && user?.rol !== 'tribunal_cuentas') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">payments</span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cronograma de Pagos a Proveedores</h3>
            </div>
            <Badge variant="warning">{data.urgentPayments.length} Pagos Próximos</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th className="px-6 py-4">Fecha Vto.</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Expediente / Concepto</th>
                  <th className="px-6 py-4 text-right">Cuota</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.urgentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-900">{formatDate(p.fecha)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-primary uppercase">{p.proveedor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700">{p.expediente}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{p.titulo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-medium text-slate-500">
                      {p.cuota}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-slate-900">{formatCurrency(p.monto)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/solicitudes/${p.solicitud_id}`}>
                        <button className="px-3 py-1 bg-slate-100 text-primary rounded-lg font-black text-[9px] uppercase hover:bg-primary/10 transition-all">
                          Ver Solicitud
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {data.urgentPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No hay pagos pendientes registrados para los próximos días.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Solicitudes Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Actividad Reciente</h3>
            <Link to="/solicitudes" className="text-xs font-bold text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th className="px-6 py-4">Expediente</th>
                  <th className="px-6 py-4">Área</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentSolicitudes.map((sol) => (
                  <tr key={sol.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-primary">{sol.numero_expediente || 'S/N'}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{formatDate(sol.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{sol.areas?.nombre}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900">{formatCurrency(sol.monto_total || 0)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getColorEstadoSolicitud(sol.estado) as any}>{getLabelEstado(sol.estado)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Urgent Payments Alertas */}
        {(user?.rol !== 'area' && user?.rol !== 'tribunal_cuentas') && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-amber-400">priority_high</span>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Pagos Inmediatos</h4>
              </div>
              
              {data.urgentPayments.length > 0 ? (
                <div className="space-y-4">
                  {data.urgentPayments.map((p, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Vence el {formatDate(p.fecha)}</span>
                        <span className="text-xs font-black text-amber-400">{formatCurrency(p.monto)}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-300">
                        Cuota {p.cuota} - {p.proveedor}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-700 mb-2">task_alt</span>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sin vencimientos críticos</p>
                </div>
              )}
            </div>
            
            <Link to="/solicitudes" className="mt-6">
              <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                Ver Plan de Caja Completo
              </button>
            </Link>
            
            {/* Background decoration */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[150px]">payments</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
