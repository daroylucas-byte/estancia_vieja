import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/utils/formatters';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const formatCUIT = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
};

export const SolicitudesPage: React.FC = () => {
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user: currentUser } = useAuthStore();

  // --- Compra Express ---
  const [isExpressModalOpen, setIsExpressModalOpen] = React.useState(false);
  const [savingExpress, setSavingExpress] = React.useState(false);
  const [areas, setAreas] = React.useState<any[]>([]);
  const [providers, setProviders] = React.useState<any[]>([]);
  const [expressData, setExpressData] = React.useState({
    titulo: '', descripcion: '', area_id: '', monto: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    forma_pago: 'transferencia', factura: null as File | null,
  });

  // Buscador proveedor express
  const [proveedorSearch, setProveedorSearch] = React.useState('');
  const [proveedorFocused, setProveedorFocused] = React.useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = React.useState<{ id: string; razon_social: string } | null>(null);
  const [showNuevoProveedor, setShowNuevoProveedor] = React.useState(false);
  const [nuevoProveedor, setNuevoProveedor] = React.useState({ razon_social: '', cuit: '', condicion_fiscal: 'responsable_inscripto' });
  const [savingProveedor, setSavingProveedor] = React.useState(false);

  const proveedoresFiltrados = proveedorSearch.length >= 2
    ? providers.filter(p => p.razon_social.toLowerCase().includes(proveedorSearch.toLowerCase()))
    : [];

  const resetExpressModal = () => {
    setExpressData({ titulo: '', descripcion: '', area_id: '', monto: '', fecha_compra: new Date().toISOString().split('T')[0], forma_pago: 'transferencia', factura: null });
    setProveedorSearch(''); setProveedorSeleccionado(null); setShowNuevoProveedor(false);
    setNuevoProveedor({ razon_social: '', cuit: '', condicion_fiscal: 'responsable_inscripto' });
  };

  const handleCrearProveedorExpress = async () => {
    if (!nuevoProveedor.razon_social.trim()) return;
    const cleanCuit = nuevoProveedor.cuit.trim();
    if (cleanCuit && !/^\d{2}-\d{8}-\d{1}$/.test(cleanCuit)) { alert('Formato de CUIT inválido (XX-XXXXXXXX-X)'); return; }
    setSavingProveedor(true);
    try {
      const insertData: any = { razon_social: nuevoProveedor.razon_social.trim(), activo: true };
      if (cleanCuit) insertData.cuit = cleanCuit;
      if (nuevoProveedor.condicion_fiscal) insertData.condicion_fiscal = nuevoProveedor.condicion_fiscal;
      const { data, error } = await (supabase.from('proveedores') as any).insert(insertData).select('id, razon_social').single();
      if (error) throw error;
      setProviders(prev => [...prev, data]);
      setProveedorSeleccionado(data);
      setProveedorSearch(data.razon_social);
      setShowNuevoProveedor(false);
      setNuevoProveedor({ razon_social: '', cuit: '', condicion_fiscal: 'responsable_inscripto' });
    } catch (e: any) { alert('Error al crear proveedor: ' + e.message); }
    finally { setSavingProveedor(false); }
  };

  const handleGuardarCompraExpress = async () => {
    const proveedorSnapshot = proveedorSeleccionado;
    if (!expressData.titulo || !expressData.area_id || !expressData.monto || !proveedorSnapshot?.id) {
      alert('Completá los campos obligatorios: título, área, proveedor y monto.');
      return;
    }
    setSavingExpress(true);
    try {
      // 1. Subir factura si existe
      let facturaUrl = null;
      if (expressData.factura) {
        const fileExt = expressData.factura.name.split('.').pop()?.toLowerCase();
        const fileName = `factura-express-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('presupuestos').upload(fileName, expressData.factura);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('presupuestos').getPublicUrl(fileName);
        facturaUrl = publicUrl;
      }

      // 2. Crear solicitud con estado 'compra_express'
      const { data: solData, error: solError } = await (supabase.from('solicitudes') as any)
        .insert({ titulo: expressData.titulo, descripcion: expressData.descripcion || expressData.titulo, area_id: expressData.area_id, solicitante_id: currentUser?.id, estado: 'compra_express' })
        .select('id')
        .single();
      if (solError) throw solError;

      // 3. Crear compra directamente — el trigger fn_cc_debito_por_compra registra la CC automáticamente
      const { error: compraError } = await (supabase.from('compras') as any).insert({
        solicitud_id: solData.id,
        presupuesto_id: null,
        proveedor_id: proveedorSnapshot.id,
        registrado_por: currentUser?.id,
        tipo: 'directa',
        estado: 'compra_realizada',
        monto_total: parseFloat(expressData.monto),
        requiere_tribunal: false,
        fecha_compra: expressData.fecha_compra,
        forma_pago: expressData.forma_pago,
        factura_url: facturaUrl,
        observaciones: `Proveedor: ${proveedorSnapshot.razon_social}`,
      });
      if (compraError) throw compraError;

      setIsExpressModalOpen(false);
      resetExpressModal();
      fetchSolicitudes();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSavingExpress(false);
    }
  };

  React.useEffect(() => {
    fetchSolicitudes();
    if (currentUser?.rol === 'compras' || (currentUser?.rol as any) === 'admin') {
      supabase.from('areas').select('id, nombre').eq('activa', true).order('nombre').then(({ data }) => { if (data) setAreas(data); });
      (supabase.from('proveedores') as any).select('id, razon_social').eq('activo', true).order('razon_social').then(({ data }: any) => { if (data) setProviders(data); });
    }
  }, []);

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
    if (exp.estado === 'compra_express') {
      const compra = exp.compras?.[0];
      const hasPagos = compra?.pagos && compra.pagos.length > 0;
      if (hasPagos) {
        const allPaid = compra.pagos.every((p: any) => p.estado === 'pagado');
        if (allPaid) return { label: 'FINALIZADA', color: 'success', icon: 'verified' };
        return { label: 'EN PAGOS', color: 'primary', icon: 'payments' };
      }
      return { label: 'COMPRA DIRECTA', color: 'secondary', icon: 'bolt' };
    }
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
        <div className="flex gap-3 flex-wrap">
          {(currentUser?.rol === 'compras' || (currentUser?.rol as any) === 'admin') && (
            <Button size="lg" leftIcon="bolt" variant="secondary" onClick={() => setIsExpressModalOpen(true)}>
              COMPRA DIRECTA
            </Button>
          )}
          {(currentUser?.rol === 'area' || currentUser?.rol === 'compras' || (currentUser?.rol as any) === 'admin') && (
            <Link to="/solicitudes/nueva">
              <Button size="lg" leftIcon="add_circle">
                NUEVA SOLICITUD
              </Button>
            </Link>
          )}
        </div>
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

      {/* Modal Compra Directa Express */}
      <Modal
        isOpen={isExpressModalOpen}
        onClose={() => { setIsExpressModalOpen(false); resetExpressModal(); }}
        title="Compra Directa"
        footer={
          <Button onClick={handleGuardarCompraExpress} disabled={savingExpress}>
            {savingExpress ? 'Guardando...' : 'Registrar Compra'}
          </Button>
        }
      >
        <div className="space-y-4">
          <Input label="Título / Concepto" required value={expressData.titulo} onChange={e => setExpressData(p => ({ ...p, titulo: e.target.value }))} />
          <Input label="Descripción (Opcional)" value={expressData.descripcion} onChange={e => setExpressData(p => ({ ...p, descripcion: e.target.value }))} />
          <Select
            label="Área"
            required
            value={expressData.area_id}
            onChange={e => setExpressData(p => ({ ...p, area_id: e.target.value }))}
            options={areas.map(a => ({ value: a.id, label: a.nombre }))}
          />

          {/* Buscador proveedor */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proveedor <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={proveedorSearch}
                onChange={e => {
                  setProveedorSearch(e.target.value);
                  if (proveedorSeleccionado && e.target.value !== proveedorSeleccionado.razon_social) {
                    setProveedorSeleccionado(null);
                  }
                  setShowNuevoProveedor(false);
                }}
                onFocus={() => setProveedorFocused(true)}
                onBlur={() => setTimeout(() => setProveedorFocused(false), 150)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {proveedorSeleccionado && <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-green-500 text-base">check_circle</span>}
              {proveedorFocused && proveedorSearch.length >= 2 && !proveedorSeleccionado && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {proveedoresFiltrados.length > 0 ? proveedoresFiltrados.map(p => (
                    <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      onMouseDown={() => { setProveedorSeleccionado(p); setProveedorSearch(p.razon_social); }}>
                      {p.razon_social}
                    </button>
                  )) : (
                    <div className="px-3 py-3 text-sm text-slate-500 flex flex-col gap-2">
                      <span>No se encontró "{proveedorSearch}"</span>
                      <button type="button" className="text-primary font-semibold text-left hover:underline"
                        onMouseDown={() => { setShowNuevoProveedor(true); setNuevoProveedor(p => ({ ...p, razon_social: proveedorSearch })); }}>
                        + Agregar "{proveedorSearch}" como nuevo proveedor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {showNuevoProveedor && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nuevo Proveedor</p>
                <Input label="Razón Social" required value={nuevoProveedor.razon_social} onChange={e => setNuevoProveedor(p => ({ ...p, razon_social: e.target.value }))} />
                <Input label="CUIT" value={nuevoProveedor.cuit} onChange={e => setNuevoProveedor(p => ({ ...p, cuit: formatCUIT(e.target.value) }))} />
                <Select label="Condición Fiscal" value={nuevoProveedor.condicion_fiscal} onChange={e => setNuevoProveedor(p => ({ ...p, condicion_fiscal: e.target.value }))}
                  options={[{ value: 'responsable_inscripto', label: 'Responsable Inscripto' }, { value: 'monotributista', label: 'Monotributista' }, { value: 'exento', label: 'Exento' }, { value: 'consumidor_final', label: 'Consumidor Final' }]} />
                <div className="flex gap-2">
                  <Button onClick={handleCrearProveedorExpress} disabled={savingProveedor || !nuevoProveedor.razon_social}>
                    {savingProveedor ? 'Guardando...' : 'Guardar Proveedor'}
                  </Button>
                  <button type="button" className="text-sm text-slate-500 hover:underline" onClick={() => setShowNuevoProveedor(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto Total" type="number" required value={expressData.monto} onChange={e => setExpressData(p => ({ ...p, monto: e.target.value }))} />
            <Input label="Fecha de Compra" type="date" required value={expressData.fecha_compra} onChange={e => setExpressData(p => ({ ...p, fecha_compra: e.target.value }))} />
          </div>
          <Select label="Forma de Pago" value={expressData.forma_pago} onChange={e => setExpressData(p => ({ ...p, forma_pago: e.target.value }))}
            options={[{ value: 'transferencia', label: 'Transferencia' }, { value: 'cheque', label: 'Cheque' }, { value: 'efectivo', label: 'Efectivo' }]} />

          {/* Factura */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Factura (Opcional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative">
              <input type="file" accept="application/pdf,image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => setExpressData(p => ({ ...p, factura: e.target.files?.[0] || null }))} />
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-slate-400">upload_file</span>
                <p className="text-[11px] text-slate-500">{expressData.factura ? expressData.factura.name : 'Haz clic para subir o arrastra un archivo'}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

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
