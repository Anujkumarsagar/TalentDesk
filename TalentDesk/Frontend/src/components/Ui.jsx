import { useEffect } from 'react';
import { motion } from 'motion/react';
import Icon from './Icon';

const badgeTones = {
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-sky-50 text-sky-700',
  open: 'bg-sky-50 text-sky-700',
  applied: 'bg-sky-50 text-sky-700',
  screened: 'bg-sky-50 text-sky-700',
  hold: 'bg-amber-50 text-amber-700',
  'on-hold': 'bg-amber-50 text-amber-700',
  interviewed: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-600',
  closed: 'bg-rose-50 text-rose-600',
  rejected: 'bg-rose-50 text-rose-600',
  success: 'bg-emerald-50 text-emerald-700',
  selected: 'bg-emerald-50 text-emerald-700',
  joined: 'bg-emerald-50 text-emerald-700',
  primary: 'bg-brand-50 text-brand-700',
};

export function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeTones[tone] || badgeTones.neutral} ${className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Spinner({ dark = false }) {
  return <span className={`inline-block size-4 animate-spin rounded-full border-2 ${dark ? 'border-slate-200 border-t-brand-600' : 'border-white/40 border-t-white'}`} />;
}

export function EmptyState({ icon = 'layers', title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, width = 'max-w-xl' }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-100 grid place-items-center bg-navy-900/55 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`max-h-[calc(100vh-2rem)] w-full ${width} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
        role="dialog" aria-modal="true" aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink" aria-label="Close">
            <Icon name="x" size={18} />
          </motion.button>
        </div>
        <div className="px-6 py-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
      <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1"><strong>Request failed.</strong> {message}</div>
      {onRetry && <button type="button" className="btn btn-sm btn-secondary" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(number);
}

export const STAGES = ['APPLIED', 'SCREENED', 'INTERVIEWED', 'SELECTED', 'JOINED', 'REJECTED'];
export const JOB_STATUSES = ['OPEN', 'ON_HOLD', 'CLOSED'];

export function label(value) {
  if (!value) return '—';
  return String(value).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function stageTone(value) {
  return {
    APPLIED: 'applied', SCREENED: 'screened', INTERVIEWED: 'interviewed',
    SELECTED: 'selected', JOINED: 'joined', REJECTED: 'rejected',
  }[value] || 'neutral';
}

export function statusTone(value) {
  return { OPEN: 'open', ON_HOLD: 'hold', CLOSED: 'closed' }[value] || 'neutral';
}
