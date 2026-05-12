import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-purple-500' },
  { value: 'compras', label: 'Jefe de Compras', color: 'bg-blue-500' },
  { value: 'jefa_comunal', label: 'Intendente', color: 'bg-green-600' },
  { value: 'tesorero', label: 'Tesorero', color: 'bg-amber-500' },
  { value: 'tribunal_cuentas', label: 'Tribunal de Cuentas', color: 'bg-red-500' },
  { value: 'area', label: 'Área', color: 'bg-slate-500' },
] as const;

export const DevRolSwitcher: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const currentRol = ROLES.find(r => r.value === user.rol);

  const cambiarRol = async (nuevoRol: string) => {
    setLoading(true);
    try {
      if (user.id === 'demo-user-id') {
        useAuthStore.setState({ user: { ...user, rol: nuevoRol as any } });
        setOpen(false);
        return;
      }
      
      // 1. Actualizar rol en public.usuarios (el trigger sincroniza a app_metadata)
      await (supabase
        .from('usuarios') as any)
        .update({ rol: nuevoRol })
        .eq('id', user.id);

      // 2. Refrescar el JWT para que traiga el nuevo app_metadata
      await supabase.auth.refreshSession();

      // 3. Recargar página para que el nuevo JWT se aplique en todas las queries RLS
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {open && (
        <div className="mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 w-52">
          <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-2 px-1">
            🛠 DEV — Cambiar Rol
          </p>
          <div className="flex flex-col gap-1">
            {ROLES.map(rol => (
              <button
                key={rol.value}
                onClick={() => cambiarRol(rol.value)}
                disabled={loading || user.rol === rol.value}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all
                  ${user.rol === rol.value
                    ? 'bg-slate-700 text-white cursor-default'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rol.color}`} />
                {rol.label}
                {user.rol === rol.value && (
                  <span className="ml-auto text-[9px] text-slate-400">activo</span>
                )}
              </button>
            ))}
          </div>
          {loading && (
            <p className="text-center text-slate-400 text-[10px] mt-2">Cambiando rol...</p>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-white text-[11px] font-bold transition-all
          ${open ? 'bg-slate-800 border-slate-600' : `${currentRol?.color ?? 'bg-slate-700'} border-transparent hover:opacity-90`}
        `}
      >
        <span>🛠</span>
        <span>{currentRol?.label ?? user.rol}</span>
        <span className="text-[9px] opacity-70">{open ? '▲' : '▼'}</span>
      </button>
    </div>
  );
};
