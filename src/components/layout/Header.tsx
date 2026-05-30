import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getRolLabel } from '@/utils/estados';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = [
    { id: 1, title: 'Presupuesto Vencido', text: 'El presupuesto de Med-Tec ha caducado.', time: 'Hace 5 min', type: 'error', icon: 'warning' },
    { id: 2, title: 'Aprobación Pendiente', text: 'Nueva solicitud requiere firma del Intendente.', time: 'Hace 2 horas', type: 'info', icon: 'history_edu' },
    { id: 3, title: 'Tribunal de Cuentas', text: 'Expediente EXP-2024-001 aprobado por el Tribunal.', time: 'Ayer', type: 'success', icon: 'check_circle' },
  ];

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-[#e0e4e8] flex justify-between items-center h-16 px-4 md:px-6 w-full">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden material-symbols-outlined p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
        >
          menu
        </button>
        <span className="text-base md:text-lg font-bold text-primary tracking-tight truncate max-w-[180px] sm:max-w-none">
          Gestión de Contrataciones
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`material-symbols-outlined p-2 rounded-full cursor-pointer transition-colors ${showNotifications ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            notifications
          </button>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-white animate-pulse"></span>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notificaciones</h4>
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">3 NUEVAS</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          n.type === 'error' ? 'bg-error/10 text-error' : 
                          n.type === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{n.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver todas las notificaciones</button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <span className="material-symbols-outlined p-2 text-slate-600 hover:bg-slate-50 rounded-full cursor-pointer transition-colors">
          help_outline
        </span>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none mb-1">
              {user?.nombre || 'Usuario'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium uppercase">
              {user?.rol ? getRolLabel(user.rol) : 'Invitado'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden border border-primary-container/10">
            {user?.nombre ? (
              <span className="text-primary font-bold text-xs">
                {user.nombre.charAt(0)}
              </span>
            ) : (
              <span className="material-symbols-outlined text-primary">person</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
