import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';

// Input masking helpers
const formatCUIT = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
};

const formatCBU = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 22);
  if (cleaned.length <= 8) return cleaned;
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8)}`;
};

const proveedorSchema = z.object({
  razon_social: z.string().min(3, 'La razón social es obligatoria'),
  nombre_fantasia: z.string().optional(),
  cuit: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{2}-\d{8}-\d{1}$/.test(val), { message: 'Formato de CUIT inválido (XX-XXXXXXXX-X)' }),
  condicion_fiscal: z.enum(['responsable_inscripto', 'monotributista', 'exento', 'consumidor_final']).optional().or(z.literal('')),
  rubro: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().default('Córdoba'),
  codigo_postal: z.string().optional(),
  banco: z.string().optional(),
  cbu: z.string().optional().or(z.literal('')).refine(val => !val || val.replace(/\D/g, '').length === 22, { message: 'El CBU debe tener 22 dígitos' }),
  alias_cbu: z.string().optional(),
});

type ProveedorForm = z.infer<typeof proveedorSchema>;

export const CreateProveedorPage: React.FC = () => {
  const navigate = useNavigate();
  const [rubros, setRubros] = useState<{id: string, nombre: string}[]>([]);
  const [loadingRubros, setLoadingRubros] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorForm>({
    resolver: zodResolver(proveedorSchema) as any,
    defaultValues: {
      provincia: 'Córdoba',
      condicion_fiscal: '',
      rubro: '',
    }
  });

  useEffect(() => {
    const fetchRubros = async () => {
      try {
        const { data, error } = await supabase
          .from('rubros_proveedores')
          .select('id, nombre')
          .order('nombre');
        
        if (error) throw error;
        setRubros(data || []);
      } catch (e) {
        console.error('Error fetching rubros:', e);
      } finally {
        setLoadingRubros(false);
      }
    };
    fetchRubros();
  }, []);

  const onSubmit = async (data: ProveedorForm) => {
    try {
      const formattedData = {
        ...data,
        cbu: data.cbu ? data.cbu.replace(/\D/g, '') : null,
        cuit: data.cuit ? data.cuit.trim() : null,
        rubro: data.rubro || null,
        condicion_fiscal: data.condicion_fiscal || null,
      };

      const { error } = await supabase
        .from('proveedores')
        .insert([{
          ...formattedData,
          activo: true
        }] as any);

      if (error) throw error;
      
      alert('Proveedor registrado con éxito');
      navigate('/proveedores');
    } catch (err: any) {
      alert('Error al registrar: ' + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <div>
          <h2 className="text-h1 font-h1 text-on-surface">Alta de Proveedor</h2>
          <p className="text-body-md text-on-secondary-container mt-1">
            Registre una nueva entidad en el sistema de contrataciones.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">
        {/* Información Básica */}
        <div className="bg-white rounded-xl border border-[#e0e4e8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-[#e0e4e8]">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">business</span>
              DATOS FISCALES Y DE CONTACTO
            </h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Razón Social"
                placeholder="Nombre legal de la empresa"
                required
                error={errors.razon_social?.message}
                {...register('razon_social')}
              />
            </div>
            
            <Input
              label="CUIT"
              placeholder="00-00000000-0"
              error={errors.cuit?.message}
              {...register('cuit', {
                onChange: (e) => {
                  e.target.value = formatCUIT(e.target.value);
                }
              })}
            />

            <Select
              label="Condición Fiscal"
              options={[
                { value: '', label: 'Seleccionar...' },
                { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
                { value: 'monotributista', label: 'Monotributista' },
                { value: 'exento', label: 'Exento' },
                { value: 'consumidor_final', label: 'Consumidor Final' },
              ]}
              {...register('condicion_fiscal')}
            />

            <Select
              label="Rubro Principal"
              error={errors.rubro?.message}
              options={[
                { value: '', label: 'Seleccionar...' },
                ...rubros.map(r => ({ value: r.nombre, label: r.nombre }))
              ]}
              disabled={loadingRubros}
              {...register('rubro')}
            />

            <Input
              label="Correo Electrónico"
              placeholder="empresa@ejemplo.com"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
        </div>

        {/* Datos Bancarios */}
        <div className="bg-white rounded-xl border border-[#e0e4e8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-[#e0e4e8]">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
              INFORMACIÓN BANCARIA (PARA PAGOS)
            </h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Banco"
              placeholder="Ej: Banco Córdoba"
              {...register('banco')}
            />
            <div className="md:col-span-2">
              <Input
                label="CBU"
                placeholder="22 dígitos"
                error={errors.cbu?.message}
                {...register('cbu', {
                  onChange: (e) => {
                    e.target.value = formatCBU(e.target.value);
                  }
                })}
              />
            </div>
            <Input
              label="Alias CBU"
              placeholder="ejemplo.alias.banco"
              {...register('alias_cbu')}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-xl border border-[#e0e4e8] shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-[#e0e4e8]">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">location_on</span>
              DOMICILIO
            </h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Dirección"
                placeholder="Calle, Número, Piso/Dpto"
                {...register('direccion')}
              />
            </div>
            <Input
              label="Ciudad"
              placeholder="Ej: Estancia Vieja"
              {...register('ciudad')}
            />
            <Input
              label="Provincia"
              {...register('provincia')}
            />
            <Input
              label="Código Postal"
              {...register('codigo_postal')}
            />
          </div>
        </div>

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
            leftIcon="save"
          >
            GUARDAR PROVEEDOR
          </Button>
        </div>
      </form>
    </div>
  );
};
