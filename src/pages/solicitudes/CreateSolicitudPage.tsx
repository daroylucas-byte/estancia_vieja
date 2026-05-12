import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const solicitudSchema = z.object({
  titulo: z.string().min(10, 'El título debe ser descriptivo (mínimo 10 caracteres)'),
  descripcion: z.string().min(20, 'Por favor, detalle la necesidad o el producto/servicio solicitado'),
  montoEstimado: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta']),
  observaciones: z.string().optional(),
});

type SolicitudForm = z.infer<typeof solicitudSchema>;

export const CreateSolicitudPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(user?.area_id || null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudForm>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      prioridad: 'media',
    }
  });

  React.useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    const { data, error } = await supabase.from('areas').select('*').eq('activa', true);
    if (!error && data) setAreas(data);
  };

  const onSubmit = async (data: SolicitudForm) => {
    if (!user) {
      setError('Debe iniciar sesión para crear una solicitud');
      return;
    }

    const areaIdToUse = user.area_id || selectedAreaId;
    
    if (!areaIdToUse) {
      setError('Debe seleccionar un área para esta solicitud');
      return;
    }
    
    setError(null);
    try {
      const { error: insertError } = await supabase.from('solicitudes').insert({
        titulo: data.titulo,
        descripcion: data.descripcion,
        area_id: areaIdToUse,
        solicitante_id: user.id,
        estado: 'pendiente',
        observaciones: data.observaciones || ''
      } as any);

      if (insertError) throw insertError;
      
      alert('Solicitud enviada con éxito');
      navigate('/solicitudes');
    } catch (err: any) {
      setError(err.message || 'Error al crear la solicitud');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <div>
          <h2 className="text-h1 font-h1 text-on-surface">Nueva Solicitud de Compra</h2>
          <p className="text-body-md text-on-secondary-container mt-1">
            Complete el formulario para iniciar un nuevo expediente administrativo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-[#e0e4e8] p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Título del Expediente"
              placeholder="Ej: Adquisición de Cubiertas para Camiones de Recolección"
              required
              error={errors.titulo?.message}
              {...register('titulo')}
            />

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Descripción Detallada</label>
              <textarea
                className={`w-full min-h-[150px] p-4 border border-[#e0e4e8] rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none ${errors.descripcion ? 'border-error' : ''}`}
                placeholder="Describa específicamente qué se necesita, cantidades, especificaciones técnicas, etc."
                {...register('descripcion')}
              ></textarea>
              {errors.descripcion && (
                <p className="text-xs text-error font-medium">{errors.descripcion.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Monto Estimado (Opcional)"
              placeholder="0.00"
              type="number"
              step="0.01"
              icon="payments"
              {...register('montoEstimado')}
            />

            <Select
              label="Prioridad"
              required
              options={[
                { value: 'baja', label: 'Baja' },
                { value: 'media', label: 'Media' },
                { value: 'alta', label: 'Alta / Urgente' },
              ]}
              {...register('prioridad')}
            />

            <Select
              label="Área Solicitante"
              required
              value={user?.rol === 'area' ? user.area_id : (selectedAreaId || '')}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              options={areas.map(a => ({ value: a.id, label: a.nombre }))}
              placeholder="Seleccione el área..."
              disabled={user?.rol === 'area'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Observaciones Adicionales</label>
            <textarea
              className="w-full min-h-[100px] p-4 border border-[#e0e4e8] rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Cualquier dato extra que considere relevante para la Oficina de Compras..."
              {...register('observaciones')}
            ></textarea>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            CANCELAR
          </Button>
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            rightIcon="send"
          >
            ENVIAR SOLICITUD
          </Button>
        </div>
      </form>
    </div>
  );
};
