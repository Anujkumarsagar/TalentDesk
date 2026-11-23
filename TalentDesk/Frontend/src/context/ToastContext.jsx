import { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000);
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed right-6 bottom-6 z-200 flex w-[min(360px,calc(100vw-3rem))] flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-4 text-[13px] shadow-lg ${toast.type === 'error' ? 'border-l-rose-500' : 'border-l-emerald-500'}`}
            >
              <Icon name={toast.type === 'error' ? 'alert' : 'check'} size={17} className={`mt-0.5 shrink-0 ${toast.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`} />
              <span className="flex-1 text-ink">{toast.message}</span>
              <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="text-slate-400 hover:text-ink" aria-label="Dismiss">
                <Icon name="x" size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
