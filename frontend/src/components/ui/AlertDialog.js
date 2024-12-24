import React from 'react';
import { cn } from '../../lib/utils';

export function AlertDialog({ open, onOpenChange, children }) {
  return open ? (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative">
        {React.Children.map(children, child =>
          React.cloneElement(child, { onClose: () => onOpenChange(false) })
        )}
      </div>
    </div>
  ) : null;
}

export function AlertDialogTrigger({ children }) {
  return children;
}

export function AlertDialogContent({ children, onClose }) {
  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto">
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children }) {
  return <div className="mb-4">{children}</div>;
}

export function AlertDialogTitle({ children }) {
  return <h2 className="text-xl font-semibold">{children}</h2>;
}

export function AlertDialogDescription({ children }) {
  return <p className="text-gray-600 mt-2">{children}</p>;
}

export function AlertDialogFooter({ children }) {
  return <div className="flex justify-end space-x-2 mt-4">{children}</div>;
}

export function AlertDialogAction({ children, onClick }) {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, onClick }) {
  return (
    <button
      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      onClick={onClick}
    >
      {children}
    </button>
  );
}