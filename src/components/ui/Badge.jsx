import React from 'react';

const variants = {
  libre: 'bg-green-100 text-green-700 border-green-200',
  ocupada: 'bg-red-100 text-red-700 border-red-200',
  reservada: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  mantenimiento: 'bg-gray-100 text-gray-600 border-gray-200',
  limpieza: 'bg-blue-100 text-blue-700 border-blue-200',
  activa: 'bg-green-100 text-green-700 border-green-200',
  cerrada: 'bg-gray-100 text-gray-600 border-gray-200',
  abierto: 'bg-red-100 text-red-700 border-red-200',
  en_proceso: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cerrado: 'bg-gray-100 text-gray-600 border-gray-200',
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  baja: 'bg-blue-100 text-blue-700 border-blue-200',
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  supervisor: 'bg-blue-100 text-blue-700 border-blue-200',
  recepcionista: 'bg-green-100 text-green-700 border-green-200',
  consulta: 'bg-gray-100 text-gray-600 border-gray-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
};

const labels = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  mantenimiento: 'Mantenimiento',
  limpieza: 'Limpieza',
  activa: 'Activa',
  cerrada: 'Cerrada',
  abierto: 'Abierto',
  en_proceso: 'En Proceso',
  cerrado: 'Cerrado',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  recepcionista: 'Recepcionista',
  consulta: 'Consulta',
};

export default function Badge({ value, label, size = 'sm' }) {
  const variantClass = variants[value] || variants.default;
  const displayLabel = label || labels[value] || value;
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantClass} ${sizeClass}`}>
      {displayLabel}
    </span>
  );
}
