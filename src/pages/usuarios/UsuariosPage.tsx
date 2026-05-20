import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Database } from '@/lib/database.types';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
type Area = Database['public']['Tables']['areas']['Row'];

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'compras', label: 'Jefe de Compras', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'jefa_comunal', label: 'Intendente', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'tesorero', label: 'Tesorero', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'tribunal_cuentas', label: 'Tribunal de Cuentas', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'area', label: 'Área', color: 'bg-slate-100 text-slate-800 border-slate-200' }
] as const;

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Edit Modal State
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRol, setEditRol] = useState<string>('');
  const [editAreaId, setEditAreaId] = useState<string>('');
  const [editActivo, setEditActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Success / Error Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre', { ascending: true }) as any;

      if (usersError) throw usersError;

      // 2. Fetch Areas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('activa', true)
        .order('nombre', { ascending: true }) as any;

      if (areasError) throw areasError;

      setUsuarios(usersData || []);
      setAreas(areasData || []);
    } catch (err: any) {
      showAlert('error', err.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleEditClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditRol(usuario.rol);
    setEditAreaId(usuario.area_id || '');
    setEditActivo(usuario.activo);
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsuario) return;

    setSaving(true);
    try {
      const { error } = await (supabase
        .from('usuarios') as any)
        .update({
          rol: editRol,
          area_id: editRol === 'area' && editAreaId ? editAreaId : null,
          activo: editActivo,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUsuario.id);

      if (error) throw error;

      showAlert('success', `Usuario "${selectedUsuario.nombre}" actualizado con éxito.`);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      showAlert('error', err.message || 'Error al actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  // Filter Logic
  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = 
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'todos' || user.rol === roleFilter;
    const matchesStatus = 
      statusFilter === 'todos' || 
      (statusFilter === 'activo' && user.activo) || 
      (statusFilter === 'inactivo' && !user.activo);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Helper: Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper: Get random gradient color for Avatar
  const getAvatarGradient = (id: string) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-teal-400 to-emerald-600',
      'from-amber-400 to-orange-500',
      'from-rose-500 to-red-600',
      'from-slate-500 to-slate-700'
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRoleLabel = (value: string) => {
    const r = ROLES.find(item => item.value === value);
    return r ? r.label : value;
  };

  const getRoleStyle = (value: string) => {
    const r = ROLES.find(item => item.value === value);
    return r ? r.color : 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Stats calculation
  const totalUsers = usuarios.length;
  const activeUsers = usuarios.filter(u => u.activo).length;
  const pendingUsers = usuarios.filter(u => !u.activo).length;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Alert Component */}
      {alert && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-top-4 duration-300 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {alert.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <p className="text-sm font-semibold">{alert.message}</p>
        </div>
      )}

      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">manage_accounts</span>
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Administra los roles, áreas municipales correspondientes y estado de activación de las cuentas del personal.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Usuarios</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cuentas Activas</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{activeUsers}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">hourglass_empty</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendientes / Inactivos</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{pendingUsers}</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="md:col-span-2">
            <Input
              icon="search"
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-xs text-slate-500 uppercase tracking-widest">Rol</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-3 px-4 bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
            >
              <option value="todos">Todos los Roles</option>
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-xs text-slate-500 uppercase tracking-widest">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-3 px-4 bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos / Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            <p className="text-sm font-semibold">Cargando usuarios...</p>
          </div>
        ) : filteredUsuarios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rol asignado</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Área correspondiente</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsuarios.map((usuario) => {
                  const userArea = areas.find(a => a.id === usuario.area_id);
                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar element */}
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(usuario.id)} text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0`}>
                            {getInitials(usuario.nombre)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-snug">{usuario.nombre}</p>
                            <p className="text-xs text-slate-400 font-medium">{usuario.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${getRoleStyle(usuario.rol)}`}>
                          {getRoleLabel(usuario.rol)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {usuario.rol === 'area' ? (
                          userArea ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                              <span className="material-symbols-outlined text-xs text-slate-400">lan</span>
                              {userArea.nombre}
                            </span>
                          ) : (
                            <span className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-lg flex items-center w-fit gap-1">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              Sin Área Asignada
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">No aplica</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          usuario.activo 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(usuario)}
                          className="inline-flex items-center justify-center p-2 rounded-xl text-primary hover:bg-primary/10 transition-all font-semibold active:scale-95 border border-transparent hover:border-primary/10"
                          title="Editar permisos"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3 italic">
            <span className="material-symbols-outlined text-5xl opacity-20">search_off</span>
            <p className="text-sm">No se encontraron usuarios que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {isEditModalOpen && selectedUsuario && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                Editar Permisos de Usuario
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-8 space-y-6">
              {/* User Identity Details */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(selectedUsuario.id)} text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0`}>
                  {getInitials(selectedUsuario.nombre)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-snug">{selectedUsuario.nombre}</p>
                  <p className="text-xs text-slate-400 font-semibold">{selectedUsuario.email}</p>
                </div>
              </div>

              {/* Role Select Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="font-label-bold text-sm text-slate-700">Rol asignado</label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value)}
                  className="w-full py-3.5 px-4 bg-white border border-outline-variant rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer font-medium"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* Municipal Area Selection (Conditional display) */}
              {editRol === 'area' && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="font-label-bold text-sm text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">lan</span>
                    Área correspondiente
                  </label>
                  <select
                    value={editAreaId}
                    onChange={(e) => setEditAreaId(e.target.value)}
                    required
                    className="w-full py-3.5 px-4 bg-white border border-outline-variant rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="" disabled>Seleccionar un área...</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                  {editAreaId === '' && (
                    <span className="text-xs text-error font-medium flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Debe seleccionar el área a la que pertenece el usuario.
                    </span>
                  )}
                </div>
              )}

              {/* Account Activation Switch Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <label className="font-label-bold text-sm text-slate-800 block">Cuenta Activa</label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {editActivo ? 'Permitido iniciar sesión' : 'Acceso bloqueado'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActivo(!editActivo)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editActivo ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editActivo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={editRol === 'area' && !editAreaId}
                  leftIcon="save"
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
