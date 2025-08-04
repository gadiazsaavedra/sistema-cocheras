import { useState, useEffect } from 'react';

// Versión offline de useAuth para evitar Firebase Auth polling
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simular usuario logueado inmediatamente
    const simulatedUser = {
      uid: 'empleado-test-123',
      email: 'victor.cocheras@sistema.local',
      displayName: 'Victor Empleado'
    };
    
    setUser(simulatedUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simular login exitoso
    const simulatedUser = {
      uid: email.includes('admin') ? 'admin-123' : 'empleado-123',
      email: email,
      displayName: email.split('@')[0]
    };
    
    setUser(simulatedUser);
    return { success: true, user: simulatedUser };
  };

  const logout = async () => {
    setUser(null);
    return { success: true };
  };

  const getUserRole = () => {
    if (!user) return null;
    
    const adminEmails = ['gadiazsaavedra@gmail.com'];
    const coAdminEmails = ['c.andrea.lopez@hotmail.com'];
    
    if (adminEmails.includes(user.email)) return 'admin';
    if (coAdminEmails.includes(user.email)) return 'co-admin';
    return 'empleado';
  };

  return {
    user,
    loading,
    login,
    logout,
    role: getUserRole(),
    isAdmin: getUserRole() === 'admin',
    isCoAdmin: getUserRole() === 'co-admin',
    canConfirmPayments: ['admin', 'co-admin'].includes(getUserRole())
  };
};