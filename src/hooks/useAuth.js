import useStore from '../store/useStore.js';

export function useAuth() {
  const currentUser = useStore(s => s.currentUser);
  const login = useStore(s => s.login);
  const logout = useStore(s => s.logout);

  const isAdmin = currentUser?.rol === 'admin';
  const isSupervisor = currentUser?.rol === 'supervisor' || isAdmin;
  const isRecepcionista = currentUser?.rol === 'recepcionista' || isSupervisor;
  const canWrite = currentUser?.rol !== 'consulta';

  function hasRole(...roles) {
    return roles.includes(currentUser?.rol);
  }

  return {
    currentUser,
    login,
    logout,
    isAdmin,
    isSupervisor,
    isRecepcionista,
    canWrite,
    hasRole,
    isAuthenticated: !!currentUser,
  };
}
