import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/lib/database.types';

type Proveedor = Database['public']['Tables']['proveedores']['Row'] & {
  rubros_proveedores?: { nombre: string } | null;
};
type MovimientoCC = Database['public']['Tables']['cuenta_corriente_proveedores']['Row'];

export const ProveedorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch proveedor
        const { data: provData, error: provError } = await supabase
          .from('proveedores')
          .select(`
            *,
            rubros_proveedores (
              nombre
            )
          `)
          .eq('id', id)
          .single();
          
        if (provError) throw provError;
        setProveedor(provData);
        
        // Fetch movimientos
        const { data: movData, error: movError } = await supabase
          .from('cuenta_corriente_proveedores')
          .select('*')
          .eq('proveedor_id', id)
          .order('created_at', { ascending: false });
          
        if (movError) throw movError;
        setMovimientos(movData || []);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !proveedor) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-4">error</span>
        <h3 className="text-lg font-bold text-red-900">Error al cargar el proveedor</h3>
        <p className="text-red-700 mt-2">{error || 'El proveedor no existe'}</p>
        <Button className="mt-6" onClick={() => navigate('/proveedores')}>VOLVER AL LISTADO</Button>
      </div>
    );
  }

  // Cálculos de saldo (Contabilidad de Proveedores: Pasivo)
  // Haber: aumenta la deuda (signo = 1) -> Facturas, Notas de Débito
  // Debe: reduce la deuda (signo = -1) -> Pagos, Notas de Crédito
  const haber = movimientos
    .filter(m => m.signo === 1)
    .reduce((acc, m) => acc + Number(m.monto), 0);
    
  const debe = movimientos
    .filter(m => m.signo === -1)
    .reduce((acc, m) => acc + Number(m.monto), 0);
    
  const saldo = haber - debe;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <nav className="flex text-[10px] text-slate-400 gap-2 mb-1 font-black uppercase tracking-widest">
            <Link to="/proveedores" className="hover:text-primary transition-colors">Proveedores</Link>
            <span>/</span>
            <span className="text-slate-900">Detalle de Cuenta</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-h1 font-h1 text-slate-900">{proveedor.razon_social}</h1>
            {proveedor.inhabilitado ? (
              <Badge variant="error">INHABILITADO</Badge>
            ) : proveedor.activo ? (
              <Badge variant="success">ACTIVO</Badge>
            ) : (
              <Badge variant="warning">INACTIVO</Badge>
            )}
          </div>
          <p className="text-body-md text-slate-500 mt-1">
            CUIT: <span className="font-mono font-bold text-slate-700">{proveedor.cuit}</span> • {proveedor.rubros_proveedores?.nombre || 'Sin rubro'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {(user?.rol === 'compras' || (user?.rol as any) === 'admin') && (
            <Button variant="secondary" leftIcon="edit">EDITAR</Button>
          )}
          <Button leftIcon="print">RESUMEN</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#e0e4e8] rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <span className="material-symbols-outlined text-3xl">description</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Haber (Facturado)</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(haber)}</p>
          </div>
        </div>

        <div className="bg-white border border-[#e0e4e8] rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Debe (Pagado)</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(debe)}</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-md flex items-center gap-5 border-2 transition-all ${
          saldo > 0 ? 'bg-primary text-white border-primary/20' : 'bg-green-600 text-white border-green-500/20'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            saldo > 0 ? 'bg-white/10 text-white' : 'bg-white/10 text-white'
          }`}>
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Saldo Actual</p>
            <p className="text-2xl font-black mt-1">{formatCurrency(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-[#e0e4e8] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e0e4e8] bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Movimientos de Cuenta Corriente
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" leftIcon="filter_list">Filtrar</Button>
            {(user?.rol === 'compras' || (user?.rol as any) === 'tesorero' || (user?.rol as any) === 'admin') && (
              <Button size="sm" leftIcon="add">Nuevo Movimiento</Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Comprobante</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Debe (Pagos)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Haber (Facturas)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                    No se registran movimientos en la cuenta corriente.
                  </td>
                </tr>
              ) : (
                [...movimientos]
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .reduce((acc: any[], mov) => {
                    const lastSaldo = acc.length > 0 ? acc[acc.length - 1].runningSaldo : 0;
                    const currentSaldo = lastSaldo + (Number(mov.monto) * mov.signo);
                    acc.push({ ...mov, runningSaldo: currentSaldo });
                    return acc;
                  }, [])
                  .reverse()
                  .map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {formatDate(mov.fecha_comprobante)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none mb-1">
                            {mov.tipo_movimiento.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {mov.numero_comprobante || 'S/N'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 line-clamp-1">{mov.descripcion}</p>
                        {mov.compra_id && (
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            Ref: Compra {mov.compra_id.slice(0, 8)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                        {mov.signo === -1 ? formatCurrency(mov.monto) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">
                        {mov.signo === 1 ? formatCurrency(mov.monto) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                        {formatCurrency(mov.runningSaldo)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
