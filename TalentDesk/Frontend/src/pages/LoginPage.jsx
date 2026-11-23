import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { Page, Stagger, StaggerItem } from '../components/Motion';
import { useAuth } from '../context/AuthContext';

const demoAccounts = [
  { label: 'Recruiter', email: 'recruiter@talentdesk.com', icon: 'shield' },
  { label: 'Viewer', email: 'viewer@talentdesk.com', icon: 'eye' },
];

const features = [
  { icon: 'briefcase', text: 'Job pipeline with live stage counts' },
  { icon: 'history', text: 'Complete stage history for every candidate' },
  { icon: 'chat', text: 'AI answers grounded in your data and files' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('recruiter@talentdesk.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <div className="relative hidden flex-col overflow-hidden bg-linear-to-br from-navy-900 via-navy-800 to-[#152344] p-14 text-white lg:flex">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -25, 0], scale: [1, 1.12, 1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-44 -left-40 size-140 rounded-full bg-brand-500/25 blur-3xl" />
        <motion.div animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }} transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-40 -bottom-44 size-140 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="bg-dots absolute inset-0 opacity-20" />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative flex items-center gap-3">
          <motion.div whileHover={{ rotate: 12, scale: 1.06 }} className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-cyan-400 shadow-lg shadow-brand-500/30"><Icon name="layers" size={20} /></motion.div>
          <div>
            <div className="font-display text-lg leading-none font-extrabold">TalentDesk</div>
            <div className="mt-1 text-[9.5px] font-semibold tracking-[0.14em] text-slate-500 uppercase">Recruitment OS</div>
          </div>
        </motion.div>

        <div className="relative my-auto max-w-125">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-brand-200 backdrop-blur">
            <Icon name="sparkles" size={13} /> Hiring, with an AI copilot
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="font-display text-[42px] leading-[1.13] font-extrabold">
            Every candidate.<br />Every stage.<br /><span className="bg-linear-to-r from-brand-300 via-cyan-200 to-brand-300 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">One clear picture.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="mt-6 max-w-105 text-[15px] leading-relaxed text-slate-400">
            Track openings, move candidates through your pipeline, and ask questions about your data and documents — all in one workspace.
          </motion.p>
          <Stagger className="mt-10 grid gap-3.5">
            {features.map((feature) => (
              <StaggerItem key={feature.text} className="flex items-center gap-3 text-[13px] text-slate-300">
                <motion.div whileHover={{ rotate: 8, scale: 1.1 }} className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-brand-300"><Icon name={feature.icon} size={16} /></motion.div>
                {feature.text}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <p className="relative text-xs text-slate-600">© {new Date().getFullYear()} TalentDesk. Built for the way recruiters work.</p>
      </div>

      <div className="relative grid place-items-center overflow-hidden px-6 py-12">
        <div className="absolute top-10 right-10 size-64 rounded-full bg-brand-50/60 blur-3xl" />
        <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-100">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-cyan-400 text-white"><Icon name="layers" size={20} /></div>
            <span className="font-display text-lg font-extrabold">TalentDesk</span>
          </div>

          <h2 className="font-display text-[27px] font-extrabold">Welcome back</h2>
          <p className="mt-2 text-[13.5px] text-slate-500">Sign in to your recruitment workspace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] text-rose-700">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" /> {error}
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <label className="field-label" htmlFor="email">Email address</label>
              <div className="group relative">
                <Icon name="mail" size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
                <input id="email" type="email" required autoComplete="username" className="field-input pl-10" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
              <label className="field-label" htmlFor="password">Password</label>
              <div className="group relative">
                <Icon name="shield" size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
                <input id="password" type="password" required autoComplete="current-password" className="field-input pl-10" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </motion.div>
            <motion.button type="submit" disabled={loading} whileHover={{ y: -2, scale: 1.005 }} whileTap={{ scale: 0.985 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="btn-primary relative mt-2 w-full overflow-hidden py-3">
              <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
              {loading ? <><span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing in…</> : <>Sign in <Icon name="arrowRight" size={16} /></>}
            </motion.button>
          </form>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="mt-7 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-[12px] leading-relaxed text-slate-500">
            <div className="mb-2 font-bold text-ink">Demo accounts</div>
            Password for both: <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-brand-700 ring-1 ring-slate-200">password123</code>
            <div className="mt-3 grid gap-2">
              {demoAccounts.map((account) => (
                <motion.button key={account.email} type="button" whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setEmail(account.email); setPassword('password123'); }} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="flex items-center gap-2 font-semibold text-ink"><Icon name={account.icon} size={14} className="text-brand-500" /> {account.label}</span>
                  <span className="text-[11px] text-slate-500">{account.email}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Page>
  );
}
