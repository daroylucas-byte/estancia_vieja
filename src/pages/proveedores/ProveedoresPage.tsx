import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/lib/database.types';

type Proveedor = Database['public']['Tables']['proveedores']['Row'] & {
  rubros_proveedores?: { nombre: string } | null;
};

export const ProveedoresPage: React.FC = () => {
  const { user } = useAuthStore();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('proveedores')
        .select(`
          *,
          rubros_proveedores (
            nombre
          )
        `)
        .order('razon_social');
      
      if (error) throw error;
      setProveedores(data || []);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProveedores = proveedores.filter(p => 
    p.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cuit && p.cuit.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-h1 font-h1 text-on-surface">Registro de Proveedores</h2>
          <p className="text-body-md text-on-secondary-container mt-1">
            Gestión de empresas y particulares habilitados para contratar.
          </p>
        </div>
        {((user?.rol as any) === 'compras' || (user?.rol as any) === 'admin') && (
          <Link to="/proveedores/nuevo">
            <Button size="lg" leftIcon="person_add">
              NUEVO PROVEEDOR
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#e0e4e8] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[#e0e4e8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="pl-10 pr-4 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full max-w-md" 
              placeholder="Buscar por Razón Social o CUIT..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Total: {proveedores.length}</Badge>
            <Badge variant="success">Activos: {proveedores.filter(p => p.activo && !p.inhabilitado).length}</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-[#e0e4e8]">Razón Social / Fantasía</th>
                  <th className="px-6 py-4 border-b border-[#e0e4e8]">CUIT</th>
                  <th className="px-6 py-4 border-b border-[#e0e4e8]">Rubro</th>
                  <th className="px-6 py-4 border-b border-[#e0e4e8]">Contacto</th>
                  <th className="px-6 py-4 border-b border-[#e0e4e8]">Estado</th>
                  <th className="px-6 py-4 border-b border-[#e0e4e8] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e4e8]">
                {filteredProveedores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">
                      No se encontraron proveedores.
                    </td>
                  </tr>
                ) : (
                  filteredProveedores.map((prov) => (
                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{prov.razon_social}</p>
                        {prov.nombre_fantasia && <p className="text-xs text-slate-500">{prov.nombre_fantasia}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{prov.cuit}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded">
                          {prov.rubros_proveedores?.nombre || 'Sin rubro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{prov.email}</td>
                      <td className="px-6 py-4">
                        {prov.inhabilitado ? (
                          <Badge variant="error">INHABILITADO</Badge>
                        ) : prov.activo ? (
                          <Badge variant="success">ACTIVO</Badge>
                        ) : (
                          <Badge variant="warning">INACTIVO</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {((user?.rol as any) === 'compras' || (user?.rol as any) === 'admin') && (
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                          )}
                          <Link 
                            to={`/proveedores/${prov.id}`}
                            className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
