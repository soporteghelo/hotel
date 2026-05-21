import React, { useState } from 'react';
import { Building2, Users, Plus, Edit, Shield } from 'lucide-react';
import useStore from '../store/useStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/ui/Toast.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input, { Select } from '../components/ui/Input.jsx';

const EMPTY_HOTEL = { nombre: '', ubicacion: '', codigo: '', nPisos: 3, estado: 'activo' };
const EMPTY_USER = { nombre: '', dni: '', rol: 'recepcionista', password: '', activo: true };

function HotelForm({ initial = EMPTY_HOTEL, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre del campamento" required value={form.nombre}
          onChange={e => set('nombre', e.target.value)} className="col-span-2"
          placeholder="Campamento El Teniente" />
        <Input label="Código (1 letra)" required value={form.codigo}
          onChange={e => set('codigo', e.target.value.toUpperCase().slice(0, 1))}
          placeholder="A" maxLength={1} />
        <Input label="N° de Pisos" required type="number" min={1} max={20}
          value={form.nPisos} onChange={e => set('nPisos', parseInt(e.target.value) || 1)} />
        <Input label="Ubicación" value={form.ubicacion}
          onChange={e => set('ubicacion', e.target.value)}
          className="col-span-2" placeholder="Sector Norte, Mina..." />
        <Select label="Estado" value={form.estado} onChange={e => set('estado', e.target.value)}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={loading}>Guardar</Button>
      </div>
    </form>
  );
}

function UserForm({ initial = EMPTY_USER, onSave, onCancel, loading, isEdit }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre completo" required value={form.nombre}
          onChange={e => set('nombre', e.target.value)} className="col-span-2"
          placeholder="Juan Pérez González" />
        <Input label="DNI / RUT" required value={form.dni}
          onChange={e => set('dni', e.target.value)}
          placeholder="12345678" hint="Será usado para iniciar sesión" />
        <Select label="Rol" required value={form.rol} onChange={e => set('rol', e.target.value)}>
          <option value="admin">Administrador</option>
          <option value="supervisor">Supervisor</option>
          <option value="recepcionista">Recepcionista</option>
          <option value="consulta">Consulta</option>
        </Select>
        <Input label={isEdit ? 'Contraseña (opcional)' : 'Contraseña inicial'} type="password"
          required={!isEdit} value={form.password}
          onChange={e => set('password', e.target.value)}
          className="col-span-2"
          placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Dejar vacío para usar el DNI como contraseña'}
          hint={!isEdit ? 'Si se deja vacío, la contraseña inicial será el DNI' : ''} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={loading}>Guardar</Button>
      </div>
    </form>
  );
}

export default function Settings() {
  const { isAdmin, currentUser } = useAuth();
  const { addToast } = useToast();
  const hotels = useStore(s => s.hotels);
  const usuarios = useStore(s => s.usuarios);
  const addHotel = useStore(s => s.addHotel);
  const updateHotel = useStore(s => s.updateHotel);
  const addUsuario = useStore(s => s.addUsuario);
  const updateUsuario = useStore(s => s.updateUsuario);

  const [tab, setTab] = useState('hoteles');
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <Card>
        <div className="text-center py-12">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </Card>
    );
  }

  async function handleSaveHotel(form) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    if (editingHotel) {
      updateHotel(editingHotel.id, form);
      addToast('Hotel actualizado', 'success');
      setEditingHotel(null);
    } else {
      addHotel(form);
      addToast('Hotel registrado', 'success');
      setShowHotelForm(false);
    }
    setLoading(false);
  }

  async function handleSaveUser(form) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    if (editingUser) {
      const update = { ...form };
      if (!update.password) delete update.password;
      updateUsuario(editingUser.id, update);
      addToast('Usuario actualizado', 'success');
      setEditingUser(null);
    } else {
      // Default password = DNI if not specified
      const withPass = { ...form, password: form.password || form.dni };
      addUsuario(withPass);
      addToast(`Usuario creado. Contraseña inicial: ${withPass.password}`, 'success');
      setShowUserForm(false);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'hoteles', label: 'Hoteles / Campamentos', icon: Building2 },
          { id: 'usuarios', label: 'Usuarios del Sistema', icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Hotels tab */}
      {tab === 'hoteles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{hotels.length} campamento(s) registrado(s)</p>
            <Button onClick={() => { setShowHotelForm(true); setEditingHotel(null); }}>
              <Plus size={16} /> Nuevo Campamento
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotels.map(h => (
              <Card key={h.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                      <span className="text-xl font-black text-yellow-600">{h.codigo}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{h.nombre}</p>
                      <p className="text-xs text-gray-500">{h.ubicacion}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.nPisos} piso(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={h.estado || 'activo'} />
                    <button
                      onClick={() => setEditingHotel(h)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{usuarios.filter(u => u.activo).length} usuario(s) activo(s)</p>
            <Button onClick={() => { setShowUserForm(true); setEditingUser(null); }}>
              <Plus size={16} /> Nuevo Usuario
            </Button>
          </div>
          <Card padding="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">DNI</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{u.nombre.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-800">{u.nombre}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Tú</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell font-mono text-xs">{u.dni}</td>
                    <td className="px-4 py-3"><Badge value={u.rol} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${u.activo ? 'text-green-600' : 'text-gray-400'}`}>
                        {u.activo ? '● Activo' : '○ Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showHotelForm || !!editingHotel} onClose={() => { setShowHotelForm(false); setEditingHotel(null); }}
        title={editingHotel ? 'Editar Campamento' : 'Nuevo Campamento'}>
        <HotelForm initial={editingHotel || EMPTY_HOTEL} onSave={handleSaveHotel}
          onCancel={() => { setShowHotelForm(false); setEditingHotel(null); }} loading={loading} />
      </Modal>

      <Modal isOpen={showUserForm || !!editingUser} onClose={() => { setShowUserForm(false); setEditingUser(null); }}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <UserForm initial={editingUser || EMPTY_USER} onSave={handleSaveUser}
          onCancel={() => { setShowUserForm(false); setEditingUser(null); }}
          loading={loading} isEdit={!!editingUser} />
      </Modal>
    </div>
  );
}
