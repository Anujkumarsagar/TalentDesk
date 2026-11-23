import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import ChatPanel from './ChatPanel';
import { Tooltip } from './Motion';
import { useAuth } from '../context/AuthContext';
import { label } from './Ui';

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={{ rotate: [0, -7, 7, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-cyan-400 text-white shadow-lg shadow-brand-500/30"
      >
        <Icon name="layers" size={19} />
      </motion.div>
      <div>
        <div className="font-display text-[17px] leading-none font-extrabold text-white">TalentDesk</div>
        <div className="mt-1 text-[9.5px] font-semibold tracking-[0.14em] text-slate-500 uppercase">Recruitment OS</div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, isRecruiter, logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const section = location.pathname.startsWith('/candidates') ? 'Candidates' : 'Jobs';
  const initials = (user?.name || user?.email || '?')
    .split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const navItems = [
    { to: '/', label: 'Jobs', icon: 'briefcase', end: true },
    { to: '/candidates', label: 'Candidates', icon: 'users' },
  ];

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-navy-900/50 lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-62.5 flex-col bg-linear-to-b from-navy-900 to-navy-800 px-4 pt-7 pb-5 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-2 pb-8"><Brand /></div>

        <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">Workspace</p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setNavOpen(false)} className="relative block rounded-xl text-[13px] font-semibold">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-brand-500/20 ring-1 ring-brand-400/20"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-3 px-3 py-2.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <motion.button
            type="button"
            onClick={() => { setChatOpen(true); setNavOpen(false); }}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <Icon name="sparkles" size={18} className="text-brand-300" />
            AI Assistant
            <span className="ml-auto rounded-full bg-brand-500/25 px-2 py-0.5 text-[10px] font-bold text-brand-300">AI</span>
          </motion.button>
        </nav>

        <div className="mt-auto border-t border-white/8 pt-5">
          <div className="flex items-center gap-3 rounded-xl px-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-400 to-cyan-400 text-[12px] font-extrabold text-navy-900">{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-white">{user?.name || 'TalentDesk user'}</div>
              <div className="text-[11px] text-slate-500 capitalize">{label(user?.role)}</div>
            </div>
            <Tooltip label="Log out">
              <button type="button" onClick={handleLogout} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="Log out">
                <Icon name="logout" size={17} />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16.5 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md lg:px-8">
          <button type="button" onClick={() => setNavOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-slate-500">
            <span>Workspace</span>
            <Icon name="chevronRight" size={14} className="text-slate-300" />
            <span className="truncate font-bold text-ink">{section}</span>
            {location.pathname.includes('/candidates/') && (
              <>
                <Icon name="chevronRight" size={14} className="text-slate-300" />
                <span className="truncate font-bold text-ink">Profile</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <span className={`hidden rounded-full px-3 py-1 text-[11px] font-bold sm:inline-flex ${isRecruiter ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
              {label(user?.role)}
            </span>
            <motion.button type="button" onClick={() => setChatOpen(true)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="btn-secondary btn-sm group relative overflow-hidden">
              <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-brand-100/70 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <Icon name="sparkles" size={15} className="relative text-brand-600" />
              <span className="relative">Ask AI</span>
            </motion.button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-360 px-5 py-7 pb-20 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
