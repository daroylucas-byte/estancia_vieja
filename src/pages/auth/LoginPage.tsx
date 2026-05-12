import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Footer } from '@/components/layout/Footer';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loginDemo } = useAuthStore();
  const navigate = useNavigate();

  const handleDemo = () => {
    loginDemo();
    const user = useAuthStore.getState().user;
    if (user?.rol === 'area' || user?.rol === 'tribunal_cuentas' || (user?.rol as any) === 'admin') {
      navigate('/solicitudes');
    } else if ((user?.rol as any) === 'tesorero') {
      navigate('/tesoreria');
    } else {
      navigate('/dashboard');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
      const user = useAuthStore.getState().user;
      
      // Redirección basada en rol
      if (user?.rol === 'area' || user?.rol === 'tribunal_cuentas' || (user?.rol as any) === 'admin') {
        navigate('/solicitudes');
      } else if ((user?.rol as any) === 'tesorero') {
        navigate('/tesoreria');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Left side: Form */}
      <div className="w-full md:w-1/2 flex flex-col px-6 md:px-16 lg:px-24 py-12 justify-between bg-white shadow-xl z-10">
        <div className="flex-1 flex flex-col justify-center max-w-[420px] mx-auto w-full">
          {/* Header Section */}
          <div className="text-center mb-stack-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-xl mb-stack-md shadow-lg">
              <span className="material-symbols-outlined text-white text-4xl">account_balance</span>
            </div>
            <h1 className="font-display text-display text-on-surface tracking-tight leading-tight">
              Sistema de Contrataciones
            </h1>
            <p className="font-body-md text-body-md text-outline mt-unit">
              Acceso administrativo municipal
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
            <h2 className="font-h2 text-h2 text-on-surface mb-stack-lg border-b border-surface-variant pb-stack-md">
              Iniciar Sesión
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-stack-md">
              <Input
                label="Correo Electrónico"
                placeholder="nombre@municipio.gob.ar"
                icon="mail"
                type="email"
                required
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                required
                error={errors.password?.message}
                {...register('password')}
                rightElement={
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-outline hover:text-primary transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
              />

              <div className="flex items-center justify-between py-unit">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
                    {...register('remember')}
                  />
                  <label htmlFor="remember" className="font-body-md text-body-md text-on-surface-variant cursor-pointer">
                    Recordarme
                  </label>
                </div>
                <Link to="/recovery" className="font-body-md text-body-md text-primary font-semibold hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                isLoading={isSubmitting}
                rightIcon="login"
              >
                Iniciar Sesión
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative px-2 bg-white text-xs text-slate-400 font-bold uppercase tracking-widest">Ó</span>
              </div>

              <button 
                type="button"
                onClick={handleDemo}
                className="w-full py-3 px-4 border-2 border-primary/20 text-primary rounded-xl font-bold text-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">visibility</span>
                ACCESO DEMO (SALTAR LOGIN)
              </button>
            </form>

            <div className="mt-stack-lg pt-stack-md border-t border-surface-variant flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-body-md text-body-md text-outline">¿No tienes cuenta?</span>
                <Link to="/register" className="font-body-md text-body-md text-primary font-semibold hover:underline">
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Right side: Decorative */}
      <div className="hidden md:flex md:w-1/2 bg-primary-container relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Municipal Building" 
            className="w-full h-full object-cover opacity-20 mix-blend-overlay" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0oH4TgdVCtR8Z2ec0MO3L2QNwjgtrS4mrKetR6ZriWHmQQsG8eVPSIRqQEsDzhamPZ_gWwpEJ7Ju3Q_j_j8Z4Mq-hPMbtRyBD47ljt4GqqIavWUGJyhDw4g8ZAAGlxBHtXtP1T-skSV_4Opo-fGMmFnBst7qwrY44QtDFXLsyWkEPOVeBdGLEEv-9zgElLXK2kXlzlAXD5ibdGAANL-XnaZKsyGDWdMEPHYPsFCNk8Gr26D1glS9-99eau4gNGFMqhdzgCMrCeaFQ"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-container/40"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl inline-block">
            <span className="material-symbols-outlined text-6xl">verified_user</span>
          </div>
          <h3 className="text-4xl font-black mb-4 leading-tight">
            Transparencia y Eficiencia en cada contratación
          </h3>
          <p className="text-xl text-white/80 font-medium leading-relaxed">
            Nuestra plataforma digital permite gestionar expedientes, presupuestos y compras de manera ágil y abierta a la comunidad.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-3xl font-black mb-1">100%</p>
              <p className="text-xs uppercase tracking-widest font-bold text-white/60">Digitalizado</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-3xl font-black mb-1">AUDITABLE</p>
              <p className="text-xs uppercase tracking-widest font-bold text-white/60">Proceso Trazable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
