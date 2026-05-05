import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const SolicitudDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = React.useState(true);
  const [solicitud, setSolicitud] = React.useState<any>(null);
  const [presupuestos, setPresupuestos] = React.useState<any[]>([]);
  const [compra, setCompra] = React.useState<any>(null);
  const [pagos, setPagos] = React.useState<any[]>([]);
  const [providers, setProviders] = React.useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [budgetToApprove, setBudgetToApprove] = React.useState<any>(null);
  const [selectedModality, setSelectedModality] = React.useState<string>('');

  React.useEffect(() => {
    if (budgetToApprove) {
      setSelectedModality(budgetToApprove.monto > 1000000 ? 'tribunal_cuentas' : 'compra_directa');
    }
  }, [budgetToApprove]);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = React.useState(false);
  const [purchaseData, setPurchaseData] = React.useState({
    fecha_compra: new Date().toISOString().split('T')[0],
    forma_pago: 'transferencia',
    factura: null as File | null
  });

  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [planConfig, setPlanConfig] = React.useState({ cuotas: 1, fechaInicio: new Date().toISOString().split('T')[0] });
  const [tempPlan, setTempPlan] = React.useState<any[]>([]);

  const [isPaymentConfirmModalOpen, setIsPaymentConfirmModalOpen] = React.useState(false);
  const [selectedPago, setSelectedPago] = React.useState<any>(null);
  const [paymentConfirmData, setPaymentConfirmData] = React.useState({
    fecha_pago_real: new Date().toISOString().split('T')[0],
    medio_pago: 'transferencia',
    comprobante: null as File | null,
    monto: 0
  });

  const handleGeneratePlan = () => {
    if (!compra) return;
    const cuotasCount = planConfig.cuotas;
    const montoCuota = Math.floor((compra.monto_total / cuotasCount) * 100) / 100;
    const plan = [];

    for (let i = 1; i <= cuotasCount; i++) {
      const fecha = new Date(planConfig.fechaInicio);
      fecha.setMonth(fecha.getMonth() + (i - 1));

      plan.push({
        numero_cuota: i,
        monto: i === cuotasCount
          ? (compra.monto_total - (montoCuota * (cuotasCount - 1))).toFixed(2)
          : montoCuota.toFixed(2),
        fecha_vencimiento: fecha.toISOString().split('T')[0]
      });
    }
    setTempPlan(plan);
  };

  const handleUpdateInstallment = (idx: number, field: string, value: any) => {
    const newPlan = [...tempPlan];
    newPlan[idx] = { ...newPlan[idx], [field]: value };
    setTempPlan(newPlan);
  };

  const [newBudget, setNewBudget] = React.useState({
    proveedor_id: '', monto: '', descripcion: '', archivo: null as File | null, fecha_caducidad: ''
  });

  React.useEffect(() => {
    if (id) {
      fetchData();
      fetchProviders();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch Solicitud con aprobador
      const { data: solData, error: solError } = await supabase
        .from('solicitudes')
        .select('*, areas(nombre), usuarios!solicitante_id(nombre), aprobador:usuarios!aprobado_por(nombre)')
        .eq('id', id)
        .single() as any;

      if (solError) throw solError;
      setSolicitud(solData);

      // Fetch Presupuestos
      const { data: presData, error: presError } = await supabase
        .from('presupuestos')
        .select('*, proveedores(razon_social, cuit)')
        .eq('solicitud_id', id) as any;

      if (presError) throw presError;
      setPresupuestos(presData || []);

      // Fetch Compra (if exists) con nombres de aprobadores y adjudicador
      const { data: compraData } = await supabase
        .from('compras')
        .select('*, tribunal:usuarios!aprobado_por_tribunal(nombre), jefa:usuarios!aprobado_por_jefa(nombre), adjudicador:usuarios!registrado_por(nombre)')
        .eq('solicitud_id', id)
        .maybeSingle() as any;

      setCompra(compraData);

      // Fetch Pagos
      if (compraData) {
        const { data: pagosData } = await supabase
          .from('pagos')
          .select('*, usuarios!registrado_por(nombre)')
          .eq('compra_id', compraData.id)
          .order('numero_cuota', { ascending: true }) as any;

        setPagos(pagosData || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    const { data } = await (supabase.from('proveedores') as any).select('id, razon_social').eq('activo', true);
    if (data) setProviders(data);
  };

  const handleUpdateEstado = async (nuevoEstado: string, observaciones?: string) => {
    try {
      const updateData: any = {
        estado: nuevoEstado,
        observaciones: observaciones || solicitud.observaciones,
        updated_at: new Date().toISOString()
      };

      if (nuevoEstado === 'aprobada') {
        updateData.aprobado_por = user?.id;
        updateData.fecha_aprobacion = new Date().toISOString();
      }

      const { error } = await (supabase
        .from('solicitudes') as any)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading || !solicitud) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando expediente...</div>;
  }

  // Determine current step for the visual indicator
  // 1: Solicitud Cargada
  // 2: Aprobada (Pendiente Presupuestos)
  // 3: Presupuestos Cargados
  // 4: Presupuesto Seleccionado (Aprobación Presupuesto)
  // 5: Tribunal/Intendente
  // 6: Compra Efectiva
  // 7: En Proceso de Pago
  // 8: Finalizada
  let currentStep = 1;
  if (solicitud.estado !== 'pendiente') currentStep = 2;
  if (presupuestos.length > 0 || solicitud.estado === 'pendiente_aprobacion_presupuestos') currentStep = 3;
  if (solicitud.estado === 'pendiente_aprobacion_presupuestos') currentStep = 4;
  if (presupuestos.some(p => p.estado === 'aprobado')) currentStep = 5;
  if (compra) {
    if (compra.aprobado_jefa) currentStep = 7; // Ya pasó por Tribunal e Intendente
    else if (compra.aprobado_tribunal || !compra.requiere_tribunal) currentStep = 6; // En proceso de firma Intendente
    else currentStep = 5; // Esperando Tribunal
  }
  if (pagos.length > 0) {
    currentStep = 8;
    const allPaid = pagos.every(p => p.estado === 'pagado');
    if (allPaid) currentStep = 9;
  }
  if (compra?.estado === 'finalizada') currentStep = 9;

  if (solicitud.estado === 'rechazada' || solicitud.estado === 'cancelada') currentStep = -1;

  const steps = [
    {
      label: 'Cargada',
      status: currentStep >= 1 ? 'completed' : 'pending',
      date: solicitud.created_at,
      user: solicitud.usuarios?.nombre
    },
    {
      label: 'Aprobación Inicial',
      status: solicitud.estado === 'rechazada' ? 'rejected' : (currentStep >= 2 ? 'completed' : 'pending'),
      date: solicitud.updated_at,
      user: solicitud.aprobador?.nombre || (currentStep >= 2 ? 'Tesorería' : null)
    },
    {
      label: 'Presupuestos',
      status: currentStep >= 3 ? 'completed' : 'pending',
      date: presupuestos[0]?.created_at,
      user: 'Múltiples Proveedores'
    },
    {
      label: 'Evaluación',
      status: currentStep >= 4 ? 'completed' : 'pending',
      date: solicitud.estado === 'pendiente_aprobacion_presupuestos' || currentStep > 4 ? solicitud.updated_at : null,
      user: 'Evaluador Técnico'
    },
    {
      label: 'Adj. Presupuesto',
      status: currentStep >= 5 ? 'completed' : 'pending',
      date: compra?.created_at,
      user: compra?.adjudicador?.nombre || 'Tesorería'
    },
    {
      label: 'Tribunal/Gobierno',
      status: currentStep >= 6 ? 'completed' : 'pending',
      date: compra?.fecha_aprobacion_jefa || compra?.fecha_aprobacion_tribunal,
      user: compra?.jefa?.nombre || compra?.tribunal?.nombre
    },
    {
      label: 'Compra',
      status: currentStep >= 7 ? 'completed' : 'pending',
      date: compra?.fecha_compra,
      user: compra?.jefa?.nombre || 'Administración'
    },
    {
      label: 'Pagos',
      status: currentStep >= 8 ? 'completed' : 'pending',
      date: pagos.find(p => p.estado === 'pagado')?.fecha_pago_real,
      user: pagos.find(p => p.estado === 'pagado')?.usuarios?.nombre
    },
    {
      label: 'Finalizada',
      status: currentStep >= 9 ? 'completed' : 'pending',
      date: pagos.filter(p => p.estado === 'pagado').pop()?.fecha_pago_real,
      user: pagos.filter(p => p.estado === 'pagado').pop()?.usuarios?.nombre
    },
  ];

  const presupuestoGanador = presupuestos.find(p => p.estado === 'aprobado');

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <nav className="flex text-[10px] text-slate-400 gap-2 mb-1 font-black uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/solicitudes')}>Expedientes</span>
            <span>/</span>
            <span className="text-slate-900">{solicitud.numero_expediente || solicitud.id.slice(0, 8)}</span>
          </nav>
          <h1 className="text-h1 font-h1 text-slate-900">{solicitud.titulo}</h1>
          <p className="text-xs text-slate-500 font-medium italic">
            Solicitado por: <span className="text-slate-700 font-bold">{solicitud.usuarios?.nombre}</span> •
            Área: <span className="text-slate-700 font-bold">{solicitud.areas?.nombre}</span>
          </p>
          {solicitud.fecha_aprobacion && (
            <div className="mt-2 flex items-center gap-2 text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 w-fit animate-in fade-in zoom-in duration-500">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="font-black uppercase tracking-wider">
                Aprobación Inicial: {solicitud.aprobador?.nombre} • {formatDate(solicitud.fecha_aprobacion)}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" leftIcon="picture_as_pdf">Exportar PDF</Button>
          <Button leftIcon="print">Imprimir</Button>
        </div>
      </div>

      {/* Visual Steps Indicator */}
      <div className="bg-white border border-[#e0e4e8] rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center relative">
          {/* Connector Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step.status === 'completed' ? 'bg-green-600 border-green-600 text-white' :
                step.status === 'rejected' ? 'bg-error border-error text-white' :
                  'bg-white border-slate-200 text-slate-400'
                }`}>
                <span className="material-symbols-outlined text-sm">
                  {step.status === 'completed' ? 'check' : (step.status === 'rejected' ? 'close' : 'radio_button_unchecked')}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[9px] font-black uppercase tracking-tighter text-center max-w-[60px] ${step.status === 'completed' ? 'text-green-700' : (step.status === 'rejected' ? 'text-error' : 'text-slate-400')
                  }`}>
                  {step.label}
                </span>
                {step.status === 'completed' && step.date && (
                  <span className="text-[7px] text-slate-400 font-bold mt-0.5">
                    {formatDate(step.date).split(' ')[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Panel for "Pendiente" */}
      {solicitud.estado === 'pendiente' && (user?.rol !== 'area' || user?.email === 'darioanzaudo@gmail.com') && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-l-primary p-6 rounded-r-2xl animate-in slide-in-from-left duration-500 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Revisión de Solicitud</h3>
              <p className="text-xs text-slate-600">Evalúe la pertinencia de este pedido para avanzar a la etapa de presupuestos.</p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="error"
                leftIcon="close"
                onClick={() => {
                  const obs = prompt('Motivo del rechazo:');
                  if (obs) handleUpdateEstado('rechazada', obs);
                }}
              >
                RECHAZAR
              </Button>
              <Button
                variant="primary"
                leftIcon="check"
                onClick={() => {
                  if (confirm('¿Aprobar solicitud para carga de presupuestos?')) {
                    handleUpdateEstado('aprobada');
                  }
                }}
              >
                APROBAR SOLICITUD
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Panel for "Enviar a Evaluación" */}
      {solicitud.estado === 'aprobada' && presupuestos.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-l-amber-500 p-6 rounded-r-2xl animate-in slide-in-from-left duration-500 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Carga de Presupuestos en Proceso</h3>
              <p className="text-xs text-slate-600">Una vez cargadas todas las ofertas, envíe el expediente para su evaluación técnica y selección.</p>
            </div>
            <Button
              variant="primary"
              leftIcon="send"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (confirm('¿Desea enviar los presupuestos para evaluación? Ya no podrá cargar nuevos presupuestos.')) {
                  handleUpdateEstado('pendiente_aprobacion_presupuestos');
                }
              }}
            >
              ENVIAR A EVALUACIÓN
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="space-y-8">
        {/* Descripcion Section */}
        <section className="bg-white border border-[#e0e4e8] rounded-2xl p-6 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">subject</span>
            Descripción del Pedido
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">{solicitud.descripcion}</p>
          {solicitud.observaciones && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observaciones / Notas</p>
              <p className="text-xs text-slate-600">{solicitud.observaciones}</p>
            </div>
          )}
        </section>

        {/* Presupuestos Section (Only if approved or further) */}
        {(currentStep >= 2 || currentStep === -1) && (
          <section className="bg-white border border-[#e0e4e8] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-[#e0e4e8] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">request_quote</span>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Presupuestos Presentados</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{presupuestos.length} OFERTAS</span>
                {solicitud.estado === 'aprobada' && (
                  <Button size="sm" leftIcon="add" onClick={() => setIsModalOpen(true)}>Agregar Presupuesto</Button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Proveedor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Caducidad</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Archivo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {presupuestos.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-all ${p.estado === 'aprobado' ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{p.proveedores?.razon_social}</p>
                          {p.estado === 'aprobado' && (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-200 font-black italic">GANADOR</span>
                          )}
                          {p.estado === 'rechazado' && (
                            <span className="bg-slate-100 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full border border-slate-200 font-black italic">NO SELECCIONADO</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">CUIT: {p.proveedores?.cuit}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(p.monto)}</td>
                      <td className="px-6 py-4 text-center text-xs text-slate-600">
                        {p.fecha_caducidad ? formatDate(p.fecha_caducidad) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.archivo_url ? (
                          <button
                            onClick={() => setPreviewUrl(p.archivo_url)}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-[10px] font-black uppercase tracking-widest"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Previsualizar
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 uppercase font-black">Sin adjunto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.estado === 'pendiente' && solicitud.estado === 'pendiente_aprobacion_presupuestos' && !presupuestos.some(x => x.estado === 'aprobado') ? (
                          <Button size="sm" onClick={() => {
                            setBudgetToApprove(p);
                            setIsConfigModalOpen(true);
                          }}>Evaluar</Button>
                        ) : (
                          <span className="material-symbols-outlined text-slate-300">more_vert</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {presupuestos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-xs">
                        No hay presupuestos cargados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Workflow & Governance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Timeline and Governance Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* GOBERNANZA PANEL */}
            {presupuestos.some(p => p.estado === 'aprobado') && (
              <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-md animate-in slide-in-from-left-4 duration-500">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  Autorizaciones Legales
                </h3>
                <div className="space-y-4">
                  {compra?.requiere_tribunal && (
                    <div className={`p-4 rounded-xl border transition-all ${compra.aprobado_tribunal ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-xs font-bold text-slate-900 mb-1">Visado Tribunal de Cuentas</p>
                      {!compra.aprobado_tribunal ? (
                        <div className="mt-3 space-y-2">
                          <Input placeholder="Nro. Resolución" className="text-xs py-1.5" />
                          <Button size="sm" className="w-full" onClick={async () => {
                            await (supabase.from('compras') as any).update({ aprobado_tribunal: true, aprobado_por_tribunal: user?.id, fecha_aprobacion_tribunal: new Date().toISOString() }).eq('id', compra.id);
                            fetchData();
                          }}>Registrar Visado</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span className="text-[11px] font-bold uppercase">Resolución Aprobada</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`p-4 rounded-xl border transition-all ${compra?.aprobado_jefa ? 'bg-green-50 border-green-200' :
                    (compra?.requiere_tribunal && !compra.aprobado_tribunal ? 'opacity-50 grayscale bg-slate-100 border-slate-100' : 'bg-slate-50 border-slate-200 border-l-4 border-l-primary')
                    }`}>
                    <p className="text-xs font-bold text-slate-900 mb-1">Decreto de Adjudicación (Intendente)</p>
                    {!compra?.aprobado_jefa ? (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={compra?.requiere_tribunal && !compra.aprobado_tribunal}
                        onClick={async () => {
                          await (supabase.from('compras') as any).update({ aprobado_jefa: true, aprobado_por_jefa: user?.id, fecha_aprobacion_jefa: new Date().toISOString(), estado: 'aprobado' }).eq('id', compra.id);
                          fetchData();
                        }}
                      >
                        FIRMAR DECRETO FINAL
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span className="text-[11px] font-bold uppercase">Decreto Firmado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EJECUCION DE COMPRA */}
            {compra?.aprobado_jefa && !compra.fecha_compra && (
              <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-md animate-in slide-in-from-left-4 duration-500">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">shopping_cart</span>
                  Ejecución de Compra
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 font-medium italic">El decreto ha sido firmado. Proceda a registrar la compra efectiva una vez realizada.</p>
                <Button
                  className="w-full"
                  leftIcon="app_registration"
                  onClick={() => setIsPurchaseModalOpen(true)}
                >
                  REGISTRAR COMPRA
                </Button>
              </div>
            )}

            {compra?.fecha_compra && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  Compra Registrada
                </h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-emerald-600 font-bold">FECHA:</span>
                    <span className="text-emerald-900 font-black">{formatDate(compra.fecha_compra)}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span className="text-emerald-600 font-bold">PAGO:</span>
                    <span className="text-emerald-900 font-black uppercase">{compra.forma_pago}</span>
                  </div>
                  {compra.factura_url && (
                    <button
                      onClick={() => setPreviewUrl(compra.factura_url)}
                      className="w-full mt-2 text-emerald-700 font-black uppercase text-[10px] hover:underline flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      Ver Factura
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* HOJA DE RUTA */}
            <div className="bg-white border border-[#e0e4e8] rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                Hoja de Ruta
              </h3>
              <div className="space-y-0 relative">
                {steps.filter(s => s.status !== 'pending' || s.label === 'Presupuestos').map((item, index) => (
                  <div key={index} className="flex gap-4 pb-8 last:pb-0 group relative">
                    {index < steps.filter(s => s.status !== 'pending' || s.label === 'Presupuestos').length - 1 && (
                      <div className={`absolute left-4 top-8 w-0.5 h-full -ml-[1px] ${item.status === 'completed' ? 'bg-green-600' : 'bg-slate-100'}`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 transition-all ${item.status === 'completed' ? 'bg-green-600 text-white border-green-100' :
                      'bg-white border-slate-100 text-slate-300'
                      }`}>
                      <span className="text-[10px] font-bold">
                        {item.status === 'completed' ? '✓' : index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xs font-bold ${item.status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>{item.label}</h4>
                      <div className="flex flex-col mt-0.5">
                        <p className="text-[10px] text-slate-500 font-medium">
                          {item.status === 'completed' ? 'Completado' : 'Pendiente'}
                        </p>
                        {item.status === 'completed' && item.date && (
                          <p className="text-[9px] text-primary font-black uppercase mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">event</span>
                            {formatDate(item.date)}
                            {item.user && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="material-symbols-outlined text-[10px]">person</span>
                                {item.user}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan de Pagos Section */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#e0e4e8] rounded-2xl overflow-hidden shadow-sm h-full flex flex-col relative">
              <div className="p-6 border-b border-[#e0e4e8] bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  Plan de Pagos
                </h3>
                {compra?.fecha_compra && pagos.length === 0 && (
                  <Button size="sm" leftIcon="auto_mode" onClick={() => setIsPlanModalOpen(true)}>Generar Plan</Button>
                )}
              </div>

              {compra?.fecha_compra && pagos.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Compra</span>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(compra.monto_total)}</span>
                  </div>
                  <div className="flex flex-col border-x border-slate-200 px-4">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Total Pagado</span>
                    <span className="text-sm font-black text-emerald-600">
                      {formatCurrency(pagos.filter(p => p.estado === 'pagado').reduce((acc, p) => acc + p.monto, 0))}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Saldo Pendiente</span>
                    <span className="text-sm font-black text-amber-600">
                      {formatCurrency(compra.monto_total - pagos.filter(p => p.estado === 'pagado').reduce((acc, p) => acc + p.monto, 0))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto p-6">
                {pagos.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuota</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pagos.sort((a, b) => a.numero_cuota - b.numero_cuota).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 text-xs font-bold text-slate-700">Cuota {p.numero_cuota}</td>
                          <td className="py-4 text-xs text-slate-500">{formatDate(p.fecha_vencimiento)}</td>
                          <td className="py-4 text-xs font-black text-slate-900 text-right">{formatCurrency(p.monto)}</td>
                          <td className="py-4 text-center">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${p.estado === 'pagado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                              {p.estado}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {p.comprobante_url && (
                                <button
                                  onClick={() => setPreviewUrl(p.comprobante_url)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded-lg transition-colors"
                                  title="Ver Comprobante"
                                >
                                  <span className="material-symbols-outlined text-sm">description</span>
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (p.estado === 'pagado') {
                                    if (confirm('¿Desea anular el registro de este pago?')) {
                                      // 1. Eliminar movimiento de cuenta corriente
                                      await (supabase
                                        .from('cuenta_corriente_proveedores') as any)
                                        .delete()
                                        .eq('pago_id', p.id);

                                      // 2. Actualizar estado del pago
                                      await (supabase.from('pagos') as any).update({
                                        estado: 'pendiente',
                                        fecha_pago_real: null,
                                        medio_pago: null,
                                        comprobante_url: null
                                      }).eq('id', p.id);

                                      // 3. Si el expediente estaba finalizado, volverlo a estado activo
                                      if (compra.estado === 'finalizada') {
                                        await (supabase.from('compras') as any).update({ estado: 'aprobado' }).eq('id', compra.id);
                                      }

                                      fetchData();
                                    }
                                  } else {
                                    setSelectedPago(p);
                                    setPaymentConfirmData({
                                      ...paymentConfirmData,
                                      monto: p.monto,
                                      fecha_pago_real: new Date().toISOString().split('T')[0]
                                    });
                                    setIsPaymentConfirmModalOpen(true);
                                  }
                                }}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                              >
                                {p.estado === 'pagado' ? 'ANULAR' : 'MARCAR PAGO'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 italic">
                    <span className="material-symbols-outlined text-4xl opacity-20">receipt</span>
                    <p className="text-xs">No hay un plan de pagos configurado.</p>
                  </div>
                )}
              </div>

              {!compra?.fecha_compra && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 mb-4">
                    <span className="material-symbols-outlined text-slate-300 text-4xl">lock</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Pagos Bloqueados</h4>
                  <p className="text-xs text-slate-500 max-w-[240px]">Debe registrarse la compra efectiva (factura) para habilitar el plan de pagos.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configurar Adjudicación"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsConfigModalOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              // Approval Logic
              try {
                // 1. Mark budget as approved
                await (supabase.from('presupuestos') as any).update({ estado: 'aprobado' }).eq('id', budgetToApprove.id);
                // 2. Reject others
                await (supabase.from('presupuestos') as any).update({ estado: 'rechazado' }).eq('solicitud_id', id).neq('id', budgetToApprove.id);
                // 3. Create Compra record
                const { error: cErr } = await (supabase.from('compras') as any).insert({
                  solicitud_id: id,
                  presupuesto_id: budgetToApprove.id,
                  registrado_por: user?.id,
                  monto_total: budgetToApprove.monto,
                  requiere_tribunal: selectedModality === 'tribunal_cuentas',
                  estado: 'pendiente_compra'
                }).select().single();

                if (cErr) throw cErr;

                // 4. Update Solicitud status
                await handleUpdateEstado('con_presupuestos'); // Or a new state like 'adjudicada'

                setIsConfigModalOpen(false);
                fetchData();
              } catch (e: any) {
                alert(e.message);
              }
            }}>Confirmar Adjudicación</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1 italic">Sugerencia Administrativa</p>
            <p className="text-sm text-slate-700">Por el monto de {formatCurrency(budgetToApprove?.monto || 0)}, se requiere {budgetToApprove?.monto > 1000000 ? 'INTERVENCIÓN DEL TRIBUNAL' : 'COMPRA DIRECTA'}.</p>
          </div>
          <Select
            label="Modalidad"
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            options={[{ value: 'compra_directa', label: 'Compra Directa' }, { value: 'tribunal_cuentas', label: 'Con Intervención Tribunal' }]}
          />
        </div>
      </Modal>

      {/* Add Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Presupuesto" footer={<Button onClick={async () => {
        if (!newBudget.monto || !newBudget.proveedor_id) {
          alert('Por favor, complete todos los campos obligatorios');
          return;
        }

        try {
          let archivoUrl = null;

          // 1. Upload file if exists
          if (newBudget.archivo) {
            const fileExt = newBudget.archivo.name.split('.').pop()?.toLowerCase();
            const fileName = `${id}-${Math.random()}.${fileExt}`;

            // Force content type if auto-detection fails
            let contentType = newBudget.archivo.type;
            if (!contentType) {
              if (fileExt === 'pdf') contentType = 'application/pdf';
              else if (['jpg', 'jpeg'].includes(fileExt!)) contentType = 'image/jpeg';
              else if (fileExt === 'png') contentType = 'image/png';
            }

            console.log('Subiendo archivo:', { fileName, contentType });

            const { error: uploadError } = await supabase.storage
              .from('presupuestos')
              .upload(fileName, newBudget.archivo, {
                contentType: contentType,
                cacheControl: '3600',
                upsert: true
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('presupuestos')
              .getPublicUrl(fileName);

            archivoUrl = publicUrl;
          }

          // 2. Insert record
          const { error } = await (supabase.from('presupuestos') as any).insert({
            solicitud_id: id,
            proveedor_id: newBudget.proveedor_id,
            monto: parseFloat(newBudget.monto),
            descripcion: newBudget.descripcion,
            cargado_por: user?.id,
            archivo_url: archivoUrl,
            fecha_caducidad: newBudget.fecha_caducidad || null
          });

          if (error) throw error;

          setIsModalOpen(false);
          fetchData();
          setNewBudget({ proveedor_id: '', monto: '', descripcion: '', archivo: null, fecha_caducidad: '' });
        } catch (e: any) {
          alert('Error: ' + e.message);
        }
      }}>Cargar</Button>}>
        <div className="space-y-4">
          <Select
            label="Proveedor"
            required
            value={newBudget.proveedor_id}
            onChange={(e) => setNewBudget({ ...newBudget, proveedor_id: e.target.value })}
            options={providers.map(p => ({ value: p.id, label: p.razon_social }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto" type="number" required value={newBudget.monto} onChange={(e) => setNewBudget({ ...newBudget, monto: e.target.value })} />
            <Input label="Caducidad" type="date" value={newBudget.fecha_caducidad} onChange={(e) => setNewBudget({ ...newBudget, fecha_caducidad: e.target.value })} />
          </div>
          <Input label="Descripción (Opcional)" value={newBudget.descripcion} onChange={(e) => setNewBudget({ ...newBudget, descripcion: e.target.value })} />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Archivo Adjunto (Presupuesto)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="application/pdf,image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setNewBudget({ ...newBudget, archivo: e.target.files?.[0] || null })}
              />
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-slate-400">upload_file</span>
                <p className="text-[11px] text-slate-500">{newBudget.archivo ? newBudget.archivo.name : 'Haz clic para subir o arrastra un archivo'}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Registrar Compra Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Registrar Compra Efectiva"
        footer={
          <Button onClick={async () => {
            if (!purchaseData.fecha_compra || !purchaseData.factura) {
              alert('La fecha y la factura son obligatorias');
              return;
            }

            try {
              let facturaUrl = null;
              const fileExt = purchaseData.factura.name.split('.').pop()?.toLowerCase();
              const fileName = `factura-${id}-${Math.random()}.${fileExt}`;

              const { error: uploadError } = await supabase.storage
                .from('presupuestos') // Reusing same bucket or you could create 'facturas'
                .upload(fileName, purchaseData.factura, {
                  contentType: purchaseData.factura.type,
                  upsert: true
                });

              if (uploadError) throw uploadError;
              const { data: { publicUrl } } = supabase.storage.from('presupuestos').getPublicUrl(fileName);
              facturaUrl = publicUrl;

              const { error } = await (supabase
                .from('compras') as any)
                .update({
                  fecha_compra: purchaseData.fecha_compra,
                  forma_pago: purchaseData.forma_pago,
                  factura_url: facturaUrl,
                  estado: 'compra_realizada'
                })
                .eq('id', compra.id);

              if (error) throw error;

              setIsPurchaseModalOpen(false);
              fetchData();
            } catch (e: any) {
              alert(e.message);
            }
          }}>Confirmar Registro de Compra</Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="Fecha de Compra"
            type="date"
            value={purchaseData.fecha_compra}
            onChange={(e) => setPurchaseData({ ...purchaseData, fecha_compra: e.target.value })}
          />
          <Select
            label="Forma de Pago"
            value={purchaseData.forma_pago}
            onChange={(e) => setPurchaseData({ ...purchaseData, forma_pago: e.target.value })}
            options={[
              { value: 'transferencia', label: 'Transferencia Bancaria' },
              { value: 'efectivo', label: 'Efectivo / Caja Chica' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'echeq', label: 'E-Cheq' },
            ]}
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Factura de Compra (PDF/Imagen)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="application/pdf,image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setPurchaseData({ ...purchaseData, factura: e.target.files?.[0] || null })}
              />
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-slate-400">receipt_long</span>
                <p className="text-[11px] text-slate-500">{purchaseData.factura ? purchaseData.factura.name : 'Subir Factura'}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Plan de Pagos Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Generar Plan de Pagos"
        size="4xl"
        footer={
          tempPlan.length > 0 && (
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado del Balance</span>
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-black ${Math.abs(compra?.monto_total - tempPlan.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0)) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Total Plan: {formatCurrency(tempPlan.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0))}
                  </div>
                  <span className="text-slate-300">/</span>
                  <div className="text-sm font-black text-slate-900">
                    Total Compra: {formatCurrency(compra?.monto_total || 0)}
                  </div>
                </div>
              </div>
              <Button
                disabled={Math.abs(compra?.monto_total - tempPlan.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0)) >= 0.01}
                onClick={async () => {
                  try {
                    const { error } = await (supabase
                      .from('pagos') as any)
                      .insert(tempPlan.map(p => ({
                        ...p,
                        compra_id: compra.id,
                        monto: parseFloat(p.monto),
                        estado: 'pendiente'
                      })));

                    if (error) throw error;
                    setIsPlanModalOpen(false);
                    fetchData();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
              >Guardar Plan de Pagos</Button>
            </div>
          )
        }
      >
        <div className="space-y-6">
          {tempPlan.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <Input
                label="Cantidad de Cuotas"
                type="number"
                min="1"
                max="24"
                value={planConfig.cuotas}
                onChange={(e) => setPlanConfig({ ...planConfig, cuotas: parseInt(e.target.value) || 1 })}
              />
              <Input
                label="Fecha Primera Cuota"
                type="date"
                value={planConfig.fechaInicio}
                onChange={(e) => setPlanConfig({ ...planConfig, fechaInicio: e.target.value })}
              />
              <div className="col-span-2 pt-2">
                <Button className="w-full" variant="outline" onClick={handleGeneratePlan}>Generar Borrador</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Ajuste de Cuotas</h4>
                <Button size="sm" variant="ghost" onClick={() => setTempPlan([])}>Reiniciar</Button>
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuota</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tempPlan.map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-xs font-bold">Cuota {p.numero_cuota}</td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            className="text-xs border-none focus:ring-0 p-0 w-full"
                            value={p.fecha_vencimiento}
                            onChange={(e) => handleUpdateInstallment(idx, 'fecha_vencimiento', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="text-xs border-none focus:ring-0 p-0 w-full font-black text-right"
                            value={p.monto}
                            onChange={(e) => handleUpdateInstallment(idx, 'monto', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmar Pago Modal */}
      <Modal
        isOpen={isPaymentConfirmModalOpen}
        onClose={() => setIsPaymentConfirmModalOpen(false)}
        title={`Registrar Pago - Cuota ${selectedPago?.numero_cuota}`}
        footer={
          <Button onClick={async () => {
            if (!paymentConfirmData.fecha_pago_real || !paymentConfirmData.monto) {
              alert('La fecha y el monto son obligatorios');
              return;
            }

            try {
              let comprobanteUrl = null;

              if (paymentConfirmData.comprobante) {
                const fileExt = paymentConfirmData.comprobante.name.split('.').pop()?.toLowerCase();
                const fileName = `pago-${selectedPago.id}-${Math.random()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('presupuestos')
                  .upload(fileName, paymentConfirmData.comprobante, {
                    contentType: paymentConfirmData.comprobante.type,
                    upsert: true
                  });

                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('presupuestos').getPublicUrl(fileName);
                comprobanteUrl = publicUrl;
              }

              const montoPagadoReal = Number(paymentConfirmData.monto);
              const diferencia = (selectedPago?.monto || 0) - montoPagadoReal;

              // 1. Actualizar la cuota actual con el monto real pagado
              const { error } = await (supabase
                .from('pagos') as any)
                .update({
                  monto: montoPagadoReal,
                  fecha_pago_real: paymentConfirmData.fecha_pago_real,
                  medio_pago: paymentConfirmData.medio_pago,
                  comprobante_url: comprobanteUrl,
                  estado: 'pagado',
                  registrado_por: user?.id
                })
                .eq('id', selectedPago.id);

              if (error) throw error;

              // 2. Si hubo un pago parcial (monto menor), crear el "resto" como nueva cuota
              if (diferencia > 0) {
                await (supabase
                  .from('pagos') as any)
                  .insert({
                    compra_id: compra.id,
                    monto: diferencia,
                    numero_cuota: selectedPago.numero_cuota,
                    fecha_vencimiento: selectedPago.fecha_vencimiento,
                    estado: 'pendiente'
                  });
              }

              // 3. Registrar movimiento en Cuenta Corriente del Proveedor
              const { error: accError } = await (supabase
                .from('cuenta_corriente_proveedores') as any)
                .insert({
                  proveedor_id: presupuestoGanador.proveedor_id,
                  pago_id: selectedPago.id,
                  compra_id: compra.id,
                  monto: montoPagadoReal,
                  signo: -1, // DEBE: reduce la deuda
                  descripcion: `Pago ${diferencia > 0 ? 'Parcial' : 'Total'} Cuota ${selectedPago.numero_cuota} - Solicitud #${solicitud.numero_expediente || (id || '').slice(0, 8)}`,
                  tipo_movimiento: diferencia > 0 ? 'pago_parcial' : 'pago_total',
                  numero_comprobante: `CUOTA-${selectedPago.numero_cuota}`,
                  fecha_comprobante: paymentConfirmData.fecha_pago_real,
                  registrado_por: (await supabase.auth.getUser()).data.user?.id
                });

              if (accError) throw accError;

              // 4. Verificar si se completó el pago total para finalizar el expediente
              const totalPagadoPrevio = pagos
                .filter(p => p.estado === 'pagado' && p.id !== selectedPago.id)
                .reduce((acc, p) => acc + p.monto, 0);

              const totalFinal = totalPagadoPrevio + montoPagadoReal;

              if (totalFinal >= (compra.monto_total - 0.01)) { // Margen por redondeo
                await (supabase
                  .from('compras') as any)
                  .update({ estado: 'finalizada' })
                  .eq('id', compra.id);
              }

              setIsPaymentConfirmModalOpen(false);
              fetchData();
            } catch (e: any) {
              alert(e.message);
            }
          }}>Registrar Pago Realizado</Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1">Monto de la Cuota Original</label>
            <div className="text-xl font-black text-primary">{formatCurrency(selectedPago?.monto || 0)}</div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto Real a Pagar ($)</label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-white border-2 border-primary/20 rounded-xl focus:border-primary outline-none transition-all font-bold text-lg"
              value={paymentConfirmData.monto}
              onChange={(e) => setPaymentConfirmData({ ...paymentConfirmData, monto: Number(e.target.value) })}
            />
            {paymentConfirmData.monto < (selectedPago?.monto || 0) && (
              <p className="text-[10px] text-amber-600 font-bold italic px-1">
                * Se creará una cuota por el saldo restante: {formatCurrency((selectedPago?.monto || 0) - paymentConfirmData.monto)}
              </p>
            )}
          </div>
          <Input
            label="Fecha Real de Pago"
            type="date"
            value={paymentConfirmData.fecha_pago_real}
            onChange={(e) => setPaymentConfirmData({ ...paymentConfirmData, fecha_pago_real: e.target.value })}
          />
          <Select
            label="Medio de Pago"
            value={paymentConfirmData.medio_pago}
            onChange={(e) => setPaymentConfirmData({ ...paymentConfirmData, medio_pago: e.target.value })}
            options={[
              { value: 'transferencia', label: 'Transferencia Bancaria' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'echeq', label: 'E-Cheq' },
              { value: 'efectivo', label: 'Efectivo' },
            ]}
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comprobante de Pago (PDF/Imagen)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="application/pdf,image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setPaymentConfirmData({ ...paymentConfirmData, comprobante: e.target.files?.[0] || null })}
              />
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-slate-400">upload_file</span>
                <p className="text-[11px] text-slate-500">{paymentConfirmData.comprobante ? paymentConfirmData.comprobante.name : 'Subir Comprobante'}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Vista Previa de Presupuesto"
        size="4xl"
      >
        <div className="w-full h-[70vh] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
          {previewUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
            <img src={previewUrl} alt="Presupuesto" className="max-w-full max-h-full object-contain" />
          ) : (
            <embed
              src={previewUrl || ''}
              type="application/pdf"
              className="w-full h-full border-none"
            />
          )}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Nota: Algunos navegadores pueden requerir descarga externa si el PDF está protegido.</p>
          <Button onClick={() => window.open(previewUrl!, '_blank')}>Abrir en Nueva Pestaña</Button>
        </div>
      </Modal>
    </div>
  );
};
