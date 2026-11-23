import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion } from 'motion/react';

const ease = [0.22, 1, 0.36, 1];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease } },
};

export function Page({ children, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className={className}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = '', as = 'div' }) {
  const Component = motion[as] || motion.div;
  return <Component variants={staggerContainer} initial="hidden" animate="show" className={className}>{children}</Component>;
}

export function StaggerItem({ children, className = '', as = 'div' }) {
  const Component = motion[as] || motion.div;
  return <Component variants={staggerItem} className={className}>{children}</Component>;
}

export function HoverLift({ children, className = '' }) {
  return (
    <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.993 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} className={className}>
      {children}
    </motion.div>
  );
}

export function CountUp({ value = 0, duration = 0.9 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, Number(value) || 0, { duration, ease: 'easeOut', onUpdate: (latest) => setDisplay(Math.round(latest)) });
    return () => controls.stop();
  }, [value, duration]);
  return <span>{display}</span>;
}

const confettiColors = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa'];

export function Confetti({ active }) {
  const pieces = useMemo(() => Array.from({ length: 22 }, (_, index) => ({
    id: index,
    x: (Math.random() - 0.5) * 420,
    y: -80 - Math.random() * 280,
    rotate: (Math.random() - 0.5) * 720,
    color: confettiColors[index % confettiColors.length],
    size: 5 + Math.random() * 5,
    delay: Math.random() * 0.12,
  })), []);

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-300 grid place-items-center overflow-hidden">
          {pieces.map((piece) => (
            <motion.span
              key={piece.id}
              className="absolute rounded-[2px]"
              style={{ width: piece.size, height: piece.size * 1.8, background: piece.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
              animate={{ x: piece.x, y: piece.y, opacity: 0, scale: 1, rotate: piece.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.15, delay: piece.delay, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export function Tooltip({ label, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-95 rounded-md bg-navy-900 px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition duration-150 group-hover:scale-100 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-shimmer rounded-xl bg-linear-to-r from-slate-100 via-slate-200/80 to-slate-100 ${className}`} />;
}
