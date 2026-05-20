import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SolicitudesPage } from '@/pages/solicitudes/SolicitudesPage';
import { SolicitudDetailPage } from '@/pages/solicitudes/SolicitudDetailPage';
import { CreateSolicitudPage } from '@/pages/solicitudes/CreateSolicitudPage';
import { TesoreriaPage } from '@/pages/tesoreria/TesoreriaPage';
import { ProveedoresPage } from '@/pages/proveedores/ProveedoresPage';
import { CreateProveedorPage } from '@/pages/proveedores/CreateProveedorPage';
import { ProveedorDetailPage } from '@/pages/proveedores/ProveedorDetailPage';
import { RubrosPage } from '@/pages/proveedores/RubrosPage';
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { DevRolSwitcher } from '@/components/dev/DevRolSwitcher';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'jefa_comunal', 'area']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/solicitudes" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'jefa_comunal', 'area', 'tribunal_cuentas', 'tesorero']}>
              <SolicitudesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/solicitudes/:id" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'jefa_comunal', 'area', 'tribunal_cuentas', 'tesorero']}>
              <SolicitudDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/solicitudes/nueva" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'area']}>
              <CreateSolicitudPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tesoreria" 
          element={
            <ProtectedRoute roles={['admin', 'tesorero', 'compras']}>
              <TesoreriaPage />
            </ProtectedRoute>
          } 
        />

        {/* Proveedores */}
        <Route 
          path="/proveedores" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'jefa_comunal', 'area']}>
              <ProveedoresPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedores/nuevo" 
          element={
            <ProtectedRoute roles={['admin', 'compras']}>
              <CreateProveedorPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedores/rubros" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'jefa_comunal']}>
              <RubrosPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedores/:id" 
          element={
            <ProtectedRoute roles={['admin', 'compras', 'jefa_comunal', 'area']}>
              <ProveedorDetailPage />
            </ProtectedRoute>
          } 
        />

        {/* Usuarios (Gestión) */}
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute roles={['admin', 'compras']}>
              <UsuariosPage />
            </ProtectedRoute>
          } 
        />

        {/* Others */}
        <Route path="/licitaciones" element={<ProtectedRoute roles={['admin', 'compras', 'jefa_comunal']}><div className="text-h1">Página de Licitaciones</div></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute roles={['admin']}><div className="text-h1">Página de Configuración</div></ProtectedRoute>} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <DevRolSwitcher />
    </BrowserRouter>
  );
}

export default App;
