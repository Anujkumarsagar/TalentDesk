import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { Modal, STAGES, label } from './Ui';
import { useToast } from '../context/ToastContext';

export default function CandidateFormModal({ candidate, defaultJobId, onClose, onSaved }) {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    name: candidate?.name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    currentCtc: candidate?.currentCtc ?? '',
    expectedCtc: candidate?.expectedCtc ?? '',
    noticeDays: candidate?.noticeDays ?? '',
    jobId: candidate?.jobId || defaultJobId || '',
    stage: candidate?.stage || 'APPLIED',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.jobs.list({ limit: 100 }).then((data) => setJobs(data.data)).catch(() => {});
  }, []);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const payload = { name: form.name, email: form.email, jobId: form.jobId };
    ['phone', 'currentCtc', 'expectedCtc', 'noticeDays'].forEach((field) => {
      if (form[field] !== '' && form[field] !== null && form[field] !== undefined) payload[field] = form[field];
    });
    if (!candidate) payload.stage = form.stage;

    setSaving(true);
    try {
      if (candidate) await api.candidates.update(candidate.id, payload);
      else await api.candidates.create(payload);
      toast(`Candidate ${candidate ? 'updated' : 'added'} successfully`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={candidate ? 'Edit candidate' : 'Add candidate'} subtitle={candidate ? 'Update contact and compensation details.' : 'Add a person to your pipeline.'} onClose={onClose} footer={
      <>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit" form="candidate-form" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : candidate ? 'Save changes' : 'Add candidate'}</motion.button>
      </>
    }>
      {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</div>}
      <form id="candidate-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Full name</label>
          <input className="field-input" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Arjun Mehta" />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-input" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="arjun@example.com" />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="field-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9876543210" />
        </div>
        <div>
          <label className="field-label">Job</label>
          <select className="field-input" required value={form.jobId} onChange={(e) => update('jobId', e.target.value)}>
            <option value="">Select a job</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Current CTC (₹)</label>
          <input className="field-input" type="number" min="0" step="0.01" value={form.currentCtc} onChange={(e) => update('currentCtc', e.target.value)} placeholder="e.g. 4.5" />
        </div>
        <div>
          <label className="field-label">Expected CTC (₹)</label>
          <input className="field-input" type="number" min="0" step="0.01" value={form.expectedCtc} onChange={(e) => update('expectedCtc', e.target.value)} placeholder="e.g. 6" />
        </div>
        <div>
          <label className="field-label">Notice period (days)</label>
          <input className="field-input" type="number" min="0" value={form.noticeDays} onChange={(e) => update('noticeDays', e.target.value)} placeholder="e.g. 30" />
        </div>
        {!candidate && (
          <div>
            <label className="field-label">Stage</label>
            <select className="field-input" value={form.stage} onChange={(e) => update('stage', e.target.value)}>
              {STAGES.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
            </select>
          </div>
        )}
        {candidate && (
          <p className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] text-slate-500">
            To record a stage change, use the <strong className="text-ink">Move stage</strong> action — it keeps the audit history.
          </p>
        )}
      </form>
    </Modal>
  );
}
