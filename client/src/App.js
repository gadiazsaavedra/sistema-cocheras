import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import { preloadByRole } from './utils/preloadComponents';

// Lazy loading de componentes pesados
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EmpleadoDashboard = lazy(() => import('./pages/EmpleadoDashboard'));

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Cargando...</Typography>
      </Box>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

const AppLayout = ({ children }) => {
  const { user, logout, role } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleLogout = async () => {
    await logout();
  };

  // Para empleados, no mostrar AppBar porque ya tienen su propio header
  if (role === 'empleado') {
    return <main>{children}</main>;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant={isMobile ? 'body1' : 'h6'} 
            component="div" 
            sx={{ flexGrow: 1 }}
          >
            🏠 Sistema de Cocheras
            {!isMobile && (
              <Typography component="span" sx={{ ml: 1, opacity: 0.8 }}>
                - {role === 'admin' ? 'Administrador' : 'Co-Administrador'}
              </Typography>
            )}
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {!isMobile && (
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {user.email}
                </Typography>
              )}
              <Button 
                color="inherit" 
                onClick={handleLogout}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile ? 'Salir' : 'Cerrar Sesión'}
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <main>
        {children}
      </main>
    </>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>Cargando aplicación...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardRouter />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/unauthorized" 
            element={
              <AppLayout>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Typography variant="h5">No tienes permisos para acceder a esta sección</Typography>
                </div>
              </AppLayout>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    flexDirection: 'column'
  }}>
    <CircularProgress size={40} />
    <Typography sx={{ mt: 2 }}>Cargando dashboard...</Typography>
  </Box>
);

const DashboardRouter = () => {
  const { role } = useAuth();
  
  // Preload componentes basado en rol
  React.useEffect(() => {
    if (role) {
      preloadByRole(role);
    }
  }, [role]);
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      {role === 'admin' || role === 'co-admin' ? (
        <AdminDashboard />
      ) : (
        <EmpleadoDashboard />
      )}
    </Suspense>
  );
};

export default App;