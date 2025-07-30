import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getUserRole = () => {
    if (!user) return null;
    
    const adminEmails = ['gadiazsaavedra@gmail.com']; // Reemplaza con tu email real
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