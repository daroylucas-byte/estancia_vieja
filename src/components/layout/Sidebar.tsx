import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tablero', icon: 'dashboard' },
  { path: '/solicitudes', label: 'Expedientes', icon: 'description' },
  { path: '/proveedores', label: 'Proveedores', icon: 'group' },
  { path: '/proveedores/rubros', label: 'Rubros', icon: 'category' },
  { path: '/licitaciones', label: 'Licitaciones', icon: 'gavel' },
  { path: '/configuracion', label: 'Configuración', icon: 'settings' },
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-primary-container text-white flex flex-col py-6 px-4 shadow-xl border-r border-white/10 z-50">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-white text-2xl">account_balance</span>
          </div>
          <div>
            <h1 className="text-white font-black text-xl mb-0 leading-tight">Gobierno Municipal</h1>
            <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Administración Pública</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 cursor-pointer rounded-md transition-all duration-200
              ${isActive 
                ? 'bg-white/10 text-white border-l-4 border-white' 
                : 'text-white/70 hover:text-white hover:bg-white/5'}
            `}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/10 space-y-1">
        <a className="flex items-center gap-3 px-4 py-3 cursor-pointer text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200" href="#">
          <span className="material-symbols-outlined">help</span>
          <span className="font-medium text-sm">Ayuda</span>
        </a>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
