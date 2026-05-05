import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

type Rubro = any;

export const RubrosPage: React.FC = () => {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRubro, setEditingRubro] = useState<Rubro | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRubros();
  }, []);

  const fetchRubros = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('rubros_proveedores') as any)
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      setRubros(data || []);
    } catch (error) {
      console.error('Error fetching rubros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rubro?: Rubro) => {
    if (rubro) {
      setEditingRubro(rubro);
      setNombre(rubro.nombre);
      setDescripcion(rubro.descripcion || '');
    } else {
      setEditingRubro(null);
      setNombre('');
      setDescripcion('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;

    try {
      setIsSubmitting(true);
      
      if (editingRubro) {
        const { error } = await (supabase
          .from('rubros_proveedores') as any)
          .update({ nombre, descripcion })
          .eq('id', editingRubro.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('rubros_proveedores') as any)
          .insert([{ nombre, descripcion }]);
        if (error) throw error;
      }

      await fetchRubros();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving rubro:', error);
      alert('Error al guardar el rubro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este rubro? Solo podrá hacerlo si no tiene proveedores asociados.')) return;

    try {
      const { error } = await supabase
        .from('rubros_proveedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchRubros();
    } catch (error: any) {
      console.error('Error deleting rubro:', error);
      alert('No se puede eliminar el rubro. Es posible que tenga proveedores vinculados.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 font-h1 text-slate-900">Gestión de Rubros</h1>
          <p className="text-body-md text-slate-500 mt-1">
            Administre las categorías de rubros para la clasificación de proveedores.
          </p>
        </div>
        <Button leftIcon="add_circle" onClick={() => handleOpenModal()}>
          NUEVO RUBRO
        </Button>
      </div>

      <div className="bg-white border border-[#e0e4e8] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-[#e0e4e8]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Nombre del Rubro</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Fecha Creación</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e4e8]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                  </td>
                </tr>
              ) : rubros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    No hay rubros registrados.
                  </td>
                </tr>
              ) : (
                rubros.map((rubro) => (
                  <tr key={rubro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{rubro.nombre}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {rubro.descripcion || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(rubro.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(rubro)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(rubro.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRubro ? 'Editar Rubro' : 'Nuevo Rubro'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Nombre del Rubro"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Ferretería, Servicios, etc."
            required
            autoFocus
          />
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">
              Descripción (Opcional)
            </label>
            <textarea
              className="w-full bg-slate-50 border border-[#e0e4e8] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none h-24"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción del rubro..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              CANCELAR
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingRubro ? 'GUARDAR CAMBIOS' : 'CREAR RUBRO'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
