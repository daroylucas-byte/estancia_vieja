import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tablero', icon: 'dashboard', roles: ['admin', 'compras', 'jefa_comunal', 'area'] },
  { path: '/solicitudes', label: 'Expedientes', icon: 'description', roles: ['admin', 'compras', 'jefa_comunal', 'area', 'tribunal_cuentas', 'tesorero'] },
  { path: '/tesoreria', label: 'Tesorería', icon: 'payments', roles: ['admin', 'tesorero', 'compras'] },
  { path: '/proveedores', label: 'Proveedores', icon: 'group', roles: ['admin', 'compras', 'jefa_comunal', 'area'] },
  { path: '/proveedores/rubros', label: 'Rubros', icon: 'category', roles: ['admin', 'compras', 'jefa_comunal'] },
  { path: '/licitaciones', label: 'Licitaciones', icon: 'gavel', roles: ['admin', 'compras', 'jefa_comunal'] },
  { path: '/usuarios', label: 'Usuarios', icon: 'manage_accounts', roles: ['admin', 'compras'] },
  { path: '/configuracion', label: 'Configuración', icon: 'settings', roles: ['admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

  const filteredItems = NAV_ITEMS.filter(item => 
    !item.roles || (user?.rol && item.roles.includes(user.rol))
  );

  return (
    <aside className={`fixed left-0 top-0 h-full w-[260px] bg-primary-container text-white flex flex-col py-6 px-4 shadow-xl border-r border-white/10 z-50 transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-white text-2xl">account_balance</span>
          </div>
          <div>
            <h1 className="text-white font-black text-xl mb-0 leading-tight">Gobierno Municipal</h1>
            <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Administración Pública</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-white/70 hover:text-white rounded-full hover:bg-white/10 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
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
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
