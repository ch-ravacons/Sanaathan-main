import React, { createContext, useContext, useCallback, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type ToastCtx = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    const item: ToastItem = { id, type, message };
    setItems((prev) => [...prev, item]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {items.map((i) => (
          <div
            key={i.id}
            className={`min-w-[280px] max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm bg-white flex items-start gap-2 ${
              i.type === 'success' ? 'border-green-200 text-green-800' :
              i.type === 'error' ? 'border-red-200 text-red-800' :
              i.type === 'warning' ? 'border-yellow-200 text-yellow-800' :
              'border-blue-200 text-blue-800'
            }`}
          >
            <span className="font-medium capitalize mr-1">{i.type}</span>
            <span className="text-gray-800">{i.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

