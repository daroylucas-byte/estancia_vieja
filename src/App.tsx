import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SolicitudesPage } from '@/pages/solicitudes/SolicitudesPage';
import { SolicitudDetailPage } from '@/pages/solicitudes/SolicitudDetailPage';
import { CreateSolicitudPage } from '@/pages/solicitudes/CreateSolicitudPage';
import { ProveedoresPage } from '@/pages/proveedores/ProveedoresPage';
import { CreateProveedorPage } from '@/pages/proveedores/CreateProveedorPage';
import { ProveedorDetailPage } from '@/pages/proveedores/ProveedorDetailPage';
import { RubrosPage } from '@/pages/proveedores/RubrosPage';
import { AppLayout } from '@/components/layout/AppLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/solicitudes" 
          element={
            <ProtectedRoute>
              <SolicitudesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/solicitudes/:id" 
          element={
            <ProtectedRoute>
              <SolicitudDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/solicitudes/nueva" 
          element={
            <ProtectedRoute>
              <CreateSolicitudPage />
            </ProtectedRoute>
          } 
        />

        {/* Proveedores */}
        <Route 
          path="/proveedores" 
          element={
            <ProtectedRoute>
              <ProveedoresPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedores/nuevo" 
          element={
            <ProtectedRoute>
              <CreateProveedorPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedores/rubros" 
          element={
            <ProtectedRoute>
              <RubrosPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/proveedores/:id" 
          element={
            <ProtectedRoute>
              <ProveedorDetailPage />
            </ProtectedRoute>
          } 
        />

        {/* Others */}
        <Route path="/licitaciones" element={<ProtectedRoute><div className="text-h1">Página de Licitaciones</div></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><div className="text-h1">Página de Configuración</div></ProtectedRoute>} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
