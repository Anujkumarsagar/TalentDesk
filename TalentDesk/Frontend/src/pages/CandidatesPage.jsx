import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, ErrorBanner, STAGES, formatDate, label, money, stageTone } from '../components/Ui';
import { Skeleton, Tooltip } from '../components/Motion';
import Icon from '../components/Icon';
import CandidateFormModal from '../components/CandidateFormModal';

export default function CandidatesPage() {
  const { isRecruiter } = useAuth();
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [jobId, setJobId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    api.jobs.list({ limit: 100 }).then((data) => setJobs(data.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.candidates.list({ search, stage, jobId, page, limit: 20 })
      .then((data) => { setCandidates(data.data); setMeta(data.meta); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, stage, jobId, page, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, stage, jobId]);

  async function handleDelete(candidate) {
    if (!window.confirm(`Delete ${candidate.name}?`)) return;
    try {
      await api.candidates.remove(candidate.id);
      toast('Candidate deleted');
      setReloadKey((key) => key + 1);
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.14em] text-brand-600 uppercase">Pipeline</div>
          <h1 className="page-title">Candidates</h1>
          <p className="page-sub">Search and filter everyone across your open roles.</p>
        </div>
        {isRecruiter && <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn-primary" onClick={() => setFormOpen(true)}><Icon name="plus" size={16} /> Add candidate</motion.button>}
      </motion.div>

      <ErrorBanner message={error} onRetry={load} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative w-full sm:w-64">
            <Icon name="search" size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input className="field-input py-2 pl-9 text-[12px]" placeholder="Name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="field-input w-auto min-w-36 py-2 text-[12px]" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All stages</option>
            {STAGES.map((item) => <option key={item} value={item}>{label(item)}</option>)}
          </select>
          <select className="field-input w-auto min-w-44 py-2 text-[12px]" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">All jobs</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <div className="ml-auto text-xs text-slate-500">{meta.total} candidate{meta.total === 1 ? '' : 's'}</div>
        </div>

        {loading ? (
          <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
        ) : candidates.length === 0 ? (
          <EmptyState icon="users" title="No candidates found" description="Try adjusting your filters or add a new candidate." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-th">Candidate</th>
                <th className="table-th">Job</th>
                <th className="table-th">Stage</th>
                <th className="table-th">Expected CTC</th>
                <th className="table-th">Notice</th>
                <th className="table-th">Updated</th>
                <th className="table-th text-right">Actions</th>
              </tr></thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <motion.tr key={candidate.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="group transition hover:bg-slate-50/70">
                    <td className="table-td">
                      <Link to={`/candidates/${candidate.id}`} className="font-bold text-ink transition group-hover:text-brand-600">{candidate.name}</Link>
                      <div className="mt-0.5 text-[11.5px] text-slate-500">{candidate.email}</div>
                    </td>
                    <td className="table-td"><Link to={`/jobs/${candidate.job?.id}`} className="text-[12.5px] text-slate-600 hover:text-brand-600">{candidate.job?.title || '—'}</Link></td>
                    <td className="table-td"><Badge tone={stageTone(candidate.stage)}>{label(candidate.stage)}</Badge></td>
                    <td className="table-td text-[12.5px]">{money(candidate.expectedCtc)}</td>
                    <td className="table-td text-[12.5px] text-slate-600">{candidate.noticeDays === null ? '—' : `${candidate.noticeDays} days`}</td>
                    <td className="table-td text-[11.5px] text-slate-500">{formatDate(candidate.updatedAt)}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <Tooltip label="View profile"><Link to={`/candidates/${candidate.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"><Icon name="eye" size={16} /></Link></Tooltip>
                        {isRecruiter && <>
                          <Tooltip label="Edit"><button className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600" onClick={() => setFormOpen(candidate)}><Icon name="edit" size={16} /></button></Tooltip>
                          <Tooltip label="Delete"><motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(candidate)}><Icon name="trash" size={16} /></motion.button></Tooltip>
                        </>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <span>Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-1.5">
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </motion.div>

      {formOpen && <CandidateFormModal candidate={formOpen.id ? formOpen : null} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); setReloadKey((key) => key + 1); }} />}
    </>
  );
}
