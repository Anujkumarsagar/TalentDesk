import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, ErrorBanner, JOB_STATUSES, STAGES, label, statusTone } from '../components/Ui';
import { CountUp, HoverLift, Skeleton, Stagger, StaggerItem, Tooltip } from '../components/Motion';
import Icon from '../components/Icon';
import JobFormModal from '../components/JobFormModal';

const stageColors = {
  APPLIED: 'bg-sky-500', SCREENED: 'bg-indigo-500', INTERVIEWED: 'bg-amber-500',
  SELECTED: 'bg-emerald-500', JOINED: 'bg-teal-600', REJECTED: 'bg-rose-500',
};

export default function JobsPage() {
  const { isRecruiter } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.jobs.list({ search, status, page, limit: 12 })
      .then((data) => { setJobs(data.data); setMeta(data.meta); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, status, page, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, status]);

  const candidatesInView = jobs.reduce((sum, job) => sum + (job.candidateCount || 0), 0);
  const openJobs = jobs.filter((job) => job.status === 'OPEN').length;

  async function handleDelete(job) {
    if (!window.confirm(`Delete "${job.title}"? This also deletes its candidates and history.`)) return;
    try {
      await api.jobs.remove(job.id);
      toast('Job deleted');
      setReloadKey((key) => key + 1);
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.14em] text-brand-600 uppercase">Overview</div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-sub">Track every opening and see where your candidates stand.</p>
        </div>
        {isRecruiter && (
          <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn-primary" onClick={() => { setEditingJob(null); setFormOpen(true); }}>
            <Icon name="plus" size={16} /> New job
          </motion.button>
        )}
      </motion.div>

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: 'briefcase', label: 'Openings in view', value: meta.total, tone: 'bg-brand-50 text-brand-600' },
          { icon: 'activity', label: 'Currently open', value: openJobs, tone: 'bg-emerald-50 text-emerald-600' },
          { icon: 'users', label: 'Candidates in view', value: candidatesInView, tone: 'bg-cyan-50 text-cyan-600' },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <HoverLift className="card-surface flex items-center gap-4 p-5">
              <motion.div whileHover={{ rotate: 10, scale: 1.08 }} className={`grid size-11 place-items-center rounded-xl ${stat.tone}`}><Icon name={stat.icon} size={20} /></motion.div>
              <div>
                <div className="font-display text-xl font-extrabold"><CountUp value={stat.value} /></div>
                <div className="text-[11.5px] text-slate-500">{stat.label}</div>
              </div>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>

      <ErrorBanner message={error} onRetry={load} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Icon name="search" size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
          <input className="field-input pl-10" placeholder="Search title or client…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="field-input w-auto min-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {JOB_STATUSES.map((item) => <option key={item} value={item}>{label(item)}</option>)}
        </select>
        <div className="ml-auto text-xs text-slate-500">{meta.total} job{meta.total === 1 ? '' : 's'}</div>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-72" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card-surface">
          <EmptyState icon="briefcase" title={search || status ? 'No jobs match your filters' : 'No jobs yet'} description={search || status ? 'Try a different search or status.' : 'Create your first opening to start tracking candidates.'} action={isRecruiter && !search && !status ? <button className="btn-primary" onClick={() => setFormOpen(true)}><Icon name="plus" size={16} /> New job</button> : null} />
        </div>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const total = job.candidateCount || 0;
            return (
              <StaggerItem key={job.id}>
                <HoverLift className="card-surface group relative overflow-hidden">
                  <div className="h-1 bg-linear-to-r from-brand-500 via-cyan-400 to-brand-500 opacity-70 transition-opacity group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent via-brand-50/0 to-brand-50/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/jobs/${job.id}`} className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-[15px] font-bold transition-colors group-hover:text-brand-600">{job.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500"><Icon name="building" size={13} /> {job.clientName}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500"><Icon name="pin" size={13} /> {job.location}</p>
                      </Link>
                      <Badge tone={statusTone(job.status)}>{label(job.status)}</Badge>
                    </div>

                    <div className="my-5 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12px]">
                      <span className="text-slate-500">{job.openings} opening{job.openings === 1 ? '' : 's'}</span>
                      <span className="font-bold text-ink">{total} candidates</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {STAGES.map((stageName, index) => {
                        const count = job.stageCounts?.[stageName] || 0;
                        const percent = total ? (count / total) * 100 : 0;
                        return (
                          <div key={stageName} className="rounded-lg bg-slate-50/80 px-2 py-2" title={`${label(stageName)}: ${count}`}>
                            <div className="text-[9px] font-bold tracking-wide text-slate-500 uppercase">{label(stageName).slice(0, 4)}</div>
                            <div className="mt-0.5 font-display text-sm font-extrabold text-ink">{count}</div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.7, delay: index * 0.05, ease: 'easeOut' }} className={`h-full rounded-full ${stageColors[stageName]}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <Link to={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-600 transition hover:gap-2.5 hover:text-brand-700">View pipeline <Icon name="arrowRight" size={14} /></Link>
                      {isRecruiter && (
                        <div className="flex gap-1">
                          <Tooltip label="Edit job"><button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600" onClick={() => { setEditingJob(job); setFormOpen(true); }}><Icon name="edit" size={15} /></button></Tooltip>
                          <Tooltip label="Delete job"><button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(job)}><Icon name="trash" size={15} /></button></Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </HoverLift>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {meta.totalPages > 1 && (
        <div className="card-surface mt-6 flex items-center justify-between px-5 py-3.5 text-xs text-slate-500">
          <span>Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-1.5">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}

      {formOpen && <JobFormModal job={editingJob} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); setReloadKey((key) => key + 1); }} />}
    </>
  );
}
