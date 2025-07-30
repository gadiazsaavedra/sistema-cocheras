import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmpleadoDashboard from './pages/EmpleadoDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

const AppLayout = ({ children }) => {
  const { user, logout, role } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Cocheras - {role === 'admin' ? 'Administrador' : 
                                   role === 'co-admin' ? 'Co-Administrador' : 'Empleado'}
          </Typography>
          {user && (
            <Box>
              <Typography variant="body2" sx={{ mr: 2, display: 'inline' }}>
                {user.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Cerrar Sesión
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
    return <div>Cargando aplicación...</div>;
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

const DashboardRouter = () => {
  const { role } = useAuth();
  
  if (role === 'admin' || role === 'co-admin') {
    return <AdminDashboard />;
  } else {
    return <EmpleadoDashboard />;
  }
};

export default App;