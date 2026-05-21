import useStore from '../store/useStore.js';

export function useAudit() {
  const addLog = useStore(s => s.addLog);
  const logAuditoria = useStore(s => s.logAuditoria);

  return {
    addLog,
    logAuditoria,
  };
}
