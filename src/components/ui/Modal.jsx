import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Desktop: centered dialog. Mobile: bottom sheet that slides up.
const sizeClasses = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
  full: 'md:max-w-6xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape' && isOpen) onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center p-0 md:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`
        relative bg-white w-full flex flex-col
        rounded-t-3xl md:rounded-2xl
        shadow-2xl
        max-h-[92vh] md:max-h-[90vh]
        ${sizeClasses[size]}
      `}>
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-0 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-4 md:px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
