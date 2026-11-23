import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, ErrorBanner, STAGES, formatDate, label, money, stageTone, statusTone } from '../components/Ui';
import { Confetti, CountUp, Skeleton, Tooltip } from '../components/Motion';
import Icon from '../components/Icon';
import CandidateFormModal from '../components/CandidateFormModal';
import MoveStageModal from '../components/MoveStageModal';
import JobFormModal from '../components/JobFormModal';

export default function JobDetailPage() {
  const { id } = useParams();
  const { isRecruiter } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [stage, setStage] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [candidateForm, setCandidateForm] = useState(null);
  const [movingCandidate, setMovingCandidate] = useState(null);
  const [editJob, setEditJob] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.jobs.get(id), api.jobs.candidates(id, { stage, search, page, limit: 20 })])
      .then(([jobData, candidateData]) => {
        setJob(jobData.job);
        setCandidates(candidateData.data);
        setMeta(candidateData.meta);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, stage, search, page, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => { setPage(1); }, [stage, search]);

  function handleMoved() {
    setMovingCandidate(null);
    setReloadKey((key) => key + 1);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1300);
  }

  async function handleDelete(candidate) {
    if (!window.confirm(`Delete ${candidate.name}? Their stage history will also be removed.`)) return;
    try {
      await api.candidates.remove(candidate.id);
      toast('Candidate deleted');
      setReloadKey((key) => key + 1);
    } catch (err) { toast(err.message, 'error'); }
  }

  if (loading && !job) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>;
  if (error && !job) return <ErrorBanner message={error} onRetry={load} />;
  if (!job) return <EmptyState icon="briefcase" title="Job not found" description="This opening may have been deleted." action={<Link to="/" className="btn-primary">Back to jobs</Link>} />;

  return (
    <>
      <Confetti active={celebrate} />
      <div className="mb-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition hover:gap-2.5 hover:text-brand-600"><Icon name="arrowLeft" size={14} /> Back to jobs</Link>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title">{job.title}</h1>
              <Badge tone={statusTone(job.status)}>{label(job.status)}</Badge>
            </div>
            <p className="page-sub flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><Icon name="building" size={14} /> {job.clientName}</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="pin" size={14} /> {job.location}</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="briefcase" size={14} /> {job.openings} opening{job.openings === 1 ? '' : 's'}</span>
            </p>
          </div>
          {isRecruiter && <div className="flex gap-2">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn-secondary" onClick={() => setEditJob(true)}><Icon name="edit" size={15} /> Edit job</motion.button>
            <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary" onClick={() => setCandidateForm({})}><Icon name="plus" size={16} /> Add candidate</motion.button>
          </div>}
        </motion.div>
      </div>

      <div className="card-surface mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="section-title">Pipeline snapshot</div>
          <div className="text-xs text-slate-500"><CountUp value={job.candidateCount || 0} /> total candidates</div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((stageName, index) => (
            <motion.button
              key={stageName}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStage(stage === stageName ? '' : stageName)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-colors ${stage === stageName ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-200'}`}
            >
              <div className="absolute top-0 left-0 h-0.5 w-full bg-linear-to-r from-brand-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{label(stageName)}</div>
              <div className="mt-1 font-display text-xl font-extrabold text-ink"><CountUp value={job.stageCounts?.[stageName] || 0} /></div>
            </motion.button>
          ))}
        </div>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="section-title">Candidates</div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{meta.total}</span>
          <div className="ml-auto flex flex-wrap gap-2.5">
            <div className="relative">
              <Icon name="search" size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input className="field-input w-56 py-2 pl-9 text-[12px]" placeholder="Name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="field-input w-auto min-w-36 py-2 text-[12px]" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">All stages</option>
              {STAGES.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
        ) : candidates.length === 0 ? (
          <EmptyState icon="users" title={search || stage ? 'No candidates match' : 'No candidates yet'} description={search || stage ? 'Try clearing the filters.' : 'Add candidates to start tracking this pipeline.'} action={isRecruiter && !search && !stage ? <button className="btn-primary" onClick={() => setCandidateForm({})}><Icon name="plus" size={16} /> Add candidate</button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-th">Candidate</th>
                <th className="table-th">Stage</th>
                <th className="table-th">Current / Expected</th>
                <th className="table-th">Notice</th>
                <th className="table-th">Updated</th>
                <th className="table-th text-right">Actions</th>
              </tr></thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <motion.tr key={candidate.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group transition hover:bg-slate-50/70">
                    <td className="table-td">
                      <Link to={`/candidates/${candidate.id}`} className="font-bold text-ink transition group-hover:text-brand-600">{candidate.name}</Link>
                      <div className="mt-0.5 text-[11.5px] text-slate-500">{candidate.email}</div>
                      {candidate.phone && <div className="text-[11px] text-slate-400">{candidate.phone}</div>}
                    </td>
                    <td className="table-td"><Badge tone={stageTone(candidate.stage)}>{label(candidate.stage)}</Badge></td>
                    <td className="table-td text-[12.5px]"><span className="text-slate-600">{money(candidate.currentCtc)}</span><span className="mx-1.5 text-slate-300">/</span><span className="font-semibold">{money(candidate.expectedCtc)}</span></td>
                    <td className="table-td text-[12.5px] text-slate-600">{candidate.noticeDays === null ? '—' : `${candidate.noticeDays} days`}</td>
                    <td className="table-td text-[11.5px] text-slate-500">{formatDate(candidate.updatedAt)}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <Tooltip label="View history"><Link to={`/candidates/${candidate.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"><Icon name="history" size={16} /></Link></Tooltip>
                        {isRecruiter && <>
                          <Tooltip label="Move stage"><motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => setMovingCandidate(candidate)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Icon name="activity" size={16} /></motion.button></Tooltip>
                          <Tooltip label="Edit"><button type="button" onClick={() => setCandidateForm(candidate)} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"><Icon name="edit" size={16} /></button></Tooltip>
                          <Tooltip label="Delete"><button type="button" onClick={() => handleDelete(candidate)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={16} /></button></Tooltip>
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
      </div>

      {candidateForm && <CandidateFormModal candidate={candidateForm.id ? candidateForm : null} defaultJobId={id} onClose={() => setCandidateForm(null)} onSaved={() => { setCandidateForm(null); setReloadKey((key) => key + 1); }} />}
      {movingCandidate && <MoveStageModal candidate={movingCandidate} onClose={() => setMovingCandidate(null)} onMoved={handleMoved} />}
      {editJob && <JobFormModal job={job} onClose={() => setEditJob(false)} onSaved={() => { setEditJob(false); setReloadKey((key) => key + 1); }} />}
    </>
  );
}
