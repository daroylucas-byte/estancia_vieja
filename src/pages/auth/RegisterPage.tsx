import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Footer } from '@/components/layout/Footer';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nombre completo requerido'),
  email: z.string().email('Correo institucional no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          }
        }
      });

      if (authError) throw authError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <span className="material-symbols-outlined text-green-600 text-7xl mb-4">task_alt</span>
          <h2 className="text-3xl font-black mb-2 text-slate-900">Solicitud Enviada</h2>
          <p className="text-slate-600 mb-8 text-lg font-medium">
            Su cuenta ha sido creada. Por razones de seguridad, un administrador debe aprobar su acceso antes de que pueda iniciar sesión.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full" size="lg">
            Volver al Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Left side: Context */}
      <div className="hidden md:flex md:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-container rounded-full -mr-96 -mt-96 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white rounded-full -ml-64 -mb-64 opacity-5"></div>
        </div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl inline-block">
            <span className="material-symbols-outlined text-6xl">account_balance</span>
          </div>
          <h3 className="text-4xl font-black mb-4 leading-tight">
            Únete a la Red Administrativa Municipal
          </h3>
          <p className="text-xl text-white/80 font-medium leading-relaxed">
            Solicita acceso a tu área correspondiente para empezar a gestionar expedientes y compras de forma centralizada.
          </p>
          
          <ul className="mt-12 space-y-6">
            <li className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white p-2 bg-white/10 rounded-full">check</span>
              <span className="text-lg font-bold">Gestión de áreas específicas</span>
            </li>
            <li className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white p-2 bg-white/10 rounded-full">check</span>
              <span className="text-lg font-bold">Trazabilidad de expedientes</span>
            </li>
            <li className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white p-2 bg-white/10 rounded-full">check</span>
              <span className="text-lg font-bold">Auditoría en tiempo real</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full md:w-1/2 flex flex-col px-6 md:px-16 lg:px-24 py-12 justify-between bg-white shadow-2xl z-10">
        <div className="flex-1 flex flex-col justify-center max-w-[480px] mx-auto w-full">
          <div className="mb-stack-lg">
            <h2 className="font-h1 text-h1 text-primary">Crear Cuenta</h2>
            <p className="text-outline font-body-md">Complete sus datos para solicitar acceso al sistema.</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-stack-md">
              <Input
                label="Nombre Completo"
                placeholder="Juan Pérez"
                required
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label="Correo Institucional"
                placeholder="usuario@municipio.gob.ar"
                icon="mail"
                required
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                <Input
                  label="Contraseña"
                  type="password"
                  required
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirmar"
                  type="password"
                  required
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <div className="pt-stack-md">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  isLoading={isSubmitting}
                  rightIcon="chevron_right"
                >
                  Registrarse
                </Button>
              </div>

              <p className="text-center font-body-md text-outline mt-stack-md">
                ¿Ya tiene una cuenta? <Link to="/login" className="text-primary font-bold hover:underline">Iniciar Sesión</Link>
              </p>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};
