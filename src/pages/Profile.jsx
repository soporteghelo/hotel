import React, { useState } from 'react';
import { UserCircle, Lock, CreditCard, Save, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';

const ROL_LABELS = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  recepcionista: 'Recepcionista',
  consulta: 'Solo Consulta',
};

export default function Profile() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const updatePerfil = useStore(s => s.updatePerfil);
  const usuarios = useStore(s => s.usuarios);

  const user = usuarios.find(u => u.id === currentUser?.id) || currentUser;

  const [nombre, setNombre] = useState(user?.nombre || '');
  const [savingNombre, setSavingNombre] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  async function handleSaveNombre(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSavingNombre(true);
    await new Promise(r => setTimeout(r, 300));
    updatePerfil(user.id, { nombre: nombre.trim() });
    addToast('Nombre actualizado correctamente', 'success');
    setSavingNombre(false);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPassError('');

    if (currentPass !== user.password) {
      setPassError('La contraseña actual es incorrecta');
      return;
    }
    if (newPass.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Las contraseñas no coinciden');
      return;
    }
    if (newPass === currentPass) {
      setPassError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setSavingPass(true);
    await new Promise(r => setTimeout(r, 300));
    updatePerfil(user.id, { password: newPass });
    addToast('Contraseña cambiada exitosamente', 'success');
    setSavingPass(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Identity card */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-3xl font-black text-white">{user.nombre?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate">{user.nombre}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge value={user.rol} />
              <span className="text-sm text-gray-500">·</span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <CreditCard size={14} />
                <span className="font-mono">{user.dni}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{ROL_LABELS[user.rol]}</p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">DNI</p>
            <p className="text-sm font-bold font-mono text-gray-800">{user.dni}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Rol</p>
            <p className="text-sm font-bold text-gray-800 capitalize">{user.rol}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Estado</p>
            <p className="text-sm font-bold text-green-600">{user.activo ? '● Activo' : '○ Inactivo'}</p>
          </div>
        </div>
      </Card>

      {/* Edit name */}
      <Card>
        <CardHeader
          title="Datos Personales"
          subtitle="Actualiza tu nombre de visualización"
        />
        <form onSubmit={handleSaveNombre} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre completo
            </label>
            <div className="relative">
              <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder="Tu nombre completo"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">DNI: <span className="font-mono font-semibold">{user.dni}</span> (no editable)</p>
            <Button
              type="submit"
              loading={savingNombre}
              disabled={nombre.trim() === user.nombre || !nombre.trim()}
            >
              <Save size={15} /> Guardar Nombre
            </Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader
          title="Cambiar Contraseña"
          subtitle="La contraseña inicial es tu número de DNI"
        />
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Contraseña actual</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nueva contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength indicator */}
            {newPass && (
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    newPass.length >= i * 3
                      ? newPass.length >= 12 ? 'bg-green-500'
                        : newPass.length >= 8 ? 'bg-yellow-500'
                        : 'bg-red-400'
                      : 'bg-gray-200'
                  }`} />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {newPass.length >= 12 ? 'Fuerte' : newPass.length >= 8 ? 'Media' : 'Débil'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirmar nueva contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                required
                placeholder="Repite la nueva contraseña"
                className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  confirmPass && newPass !== confirmPass ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {confirmPass && newPass === confirmPass && (
                <CheckCircle size={15} className="absolute right-9 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
          </div>

          {passError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {passError}
            </p>
          )}

          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield size={13} />
              <span>La contraseña se guarda localmente</span>
            </div>
            <Button
              type="submit"
              loading={savingPass}
              disabled={!currentPass || !newPass || !confirmPass}
            >
              <Lock size={15} /> Cambiar Contraseña
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
