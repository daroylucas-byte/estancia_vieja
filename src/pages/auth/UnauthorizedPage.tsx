import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
        <div className="w-20 h-20 bg-error-container rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="material-symbols-outlined text-white text-5xl">lock_open</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Acceso Restringido</h1>
        <p className="text-slate-500 mb-8 font-medium">
          Lo sentimos, no tienes los permisos necesarios para acceder a esta sección. 
          Por favor, contacta con el administrador del sistema si crees que esto es un error.
        </p>
        <div className="space-y-3">
          <Link to="/dashboard">
            <Button className="w-full" size="lg">Volver al Tablero</Button>
          </Link>
          <Link to="/login">
            <button className="w-full py-3 text-sm font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
              Cerrar Sesión e Intentar con otra cuenta
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
