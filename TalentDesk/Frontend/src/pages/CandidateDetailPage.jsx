import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge, EmptyState, ErrorBanner, formatDate, label, money, stageTone } from '../components/Ui';
import { Confetti, Skeleton, Stagger, StaggerItem, Tooltip } from '../components/Motion';
import Icon from '../components/Icon';
import CandidateFormModal from '../components/CandidateFormModal';
import MoveStageModal from '../components/MoveStageModal';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const { isRecruiter } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.candidates.get(id)
      .then((data) => setCandidate(data.candidate))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  useEffect(() => { load(); }, [load]);

  function handleMoved() {
    setMoving(false);
    setReloadKey((key) => key + 1);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1300);
  }

  if (loading && !candidate) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>;
  if (error && !candidate) return <ErrorBanner message={error} onRetry={load} />;
  if (!candidate) return <EmptyState icon="user" title="Candidate not found" action={<Link to="/candidates" className="btn-primary">Back to candidates</Link>} />;

  const events = candidate.stageEvents || [];
  const initials = candidate.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Confetti active={celebrate} />
      <Link to="/candidates" className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition hover:gap-2.5 hover:text-brand-600"><Icon name="arrowLeft" size={14} /> Back to candidates</Link>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div initial={{ scale: 0.8, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 15 }} whileHover={{ rotate: 5, scale: 1.05 }} className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-cyan-400 text-lg font-extrabold text-navy-900 shadow-lg shadow-brand-500/20">
            {initials}
          </motion.div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title">{candidate.name}</h1>
              <Badge tone={stageTone(candidate.stage)}>{label(candidate.stage)}</Badge>
            </div>
            <p className="page-sub flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><Icon name="mail" size={14} /> {candidate.email}</span>
              {candidate.phone && <span className="inline-flex items-center gap-1.5"><Icon name="phone" size={14} /> {candidate.phone}</span>}
            </p>
          </div>
        </div>
        {isRecruiter && <div className="flex gap-2">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn-secondary" onClick={() => setEditing(true)}><Icon name="edit" size={15} /> Edit</motion.button>
          <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary" onClick={() => setMoving(true)}><Icon name="activity" size={15} /> Move stage</motion.button>
        </div>}
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="card-surface relative overflow-hidden p-6">
          <div className="absolute -top-16 -right-16 size-40 rounded-full bg-brand-50 blur-2xl" />
          <div className="relative">
            <h2 className="section-title mb-5">Candidate details</h2>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                ['Applied for', <Link key="job" to={`/jobs/${candidate.job?.id}`} className="font-semibold text-brand-600 transition hover:text-brand-700">{candidate.job?.title || '—'}</Link>],
                ['Current stage', label(candidate.stage)],
                ['Current CTC', money(candidate.currentCtc)],
                ['Expected CTC', money(candidate.expectedCtc)],
                ['Notice period', candidate.noticeDays === null ? '—' : `${candidate.noticeDays} days`],
                ['Last updated', formatDate(candidate.updatedAt, true)],
              ].map(([title, value]) => (
                <div key={title}>
                  <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{title}</div>
                  <div className="mt-1.5 text-[13.5px] font-semibold text-ink">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="card-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Stage history</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{events.length}</span>
          </div>
          {events.length === 0 ? (
            <EmptyState icon="history" title="No stage changes yet" description="Stage moves recorded through the Move stage action will appear here." />
          ) : (
            <Stagger as="ol" className="m-0 list-none p-0">
              {events.map((event, index) => (
                <StaggerItem key={event.id} as="li">
                  <div className="relative flex gap-3.5 pb-6 last:pb-0">
                    {index < events.length - 1 && <span className="absolute top-6 bottom-0 left-3 w-px bg-slate-200" />}
                    <Tooltip label={formatDate(event.createdAt, true)}>
                      <motion.span whileHover={{ scale: 1.15 }} className="relative z-1 grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon name="arrowRight" size={13} /></motion.span>
                    </Tooltip>
                    <div className="pt-0.5">
                      <div className="text-[13px] font-bold">
                        {label(event.fromStage)} <span className="mx-1 text-slate-300">→</span> {label(event.toStage)}
                      </div>
                      <div className="mt-1 text-[11.5px] text-slate-500">
                        {formatDate(event.createdAt, true)} · {event.changedBy?.name || event.changedBy?.email || 'Unknown user'}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </motion.div>
      </div>

      {editing && <CandidateFormModal candidate={candidate} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setReloadKey((key) => key + 1); }} />}
      {moving && <MoveStageModal candidate={candidate} onClose={() => setMoving(false)} onMoved={handleMoved} />}
    </>
  );
}
