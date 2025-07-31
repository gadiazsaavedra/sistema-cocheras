import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar usuario guardado
    const savedUser = localStorage.getItem('cocheras_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('cocheras_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Guardar/limpiar usuario en localStorage
      if (user) {
        localStorage.setItem('cocheras_user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        localStorage.removeItem('cocheras_user');
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      let errorMessage = 'Error de conexión';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('cocheras_user');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cerrar sesión' };
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