import { useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { JOB_STATUSES, Modal, label } from './Ui';
import { useToast } from '../context/ToastContext';

export default function JobFormModal({ job, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: job?.title || '',
    clientName: job?.clientName || '',
    location: job?.location || '',
    openings: job?.openings ?? 1,
    status: job?.status || 'OPEN',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (job) await api.jobs.update(job.id, form);
      else await api.jobs.create(form);
      toast(`Job ${job ? 'updated' : 'created'} successfully`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={job ? 'Edit job' : 'New job'} subtitle={job ? 'Update the opening details.' : 'Add an opening to your pipeline.'} onClose={onClose} footer={
      <>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit" form="job-form" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : job ? 'Save changes' : 'Create job'}</motion.button>
      </>
    }>
      {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</div>}
      <form id="job-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Job title</label>
          <input className="field-input" required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Python Developer" />
        </div>
        <div>
          <label className="field-label">Client name</label>
          <input className="field-input" required value={form.clientName} onChange={(e) => update('clientName', e.target.value)} placeholder="e.g. Acme Corp" />
        </div>
        <div>
          <label className="field-label">Location</label>
          <input className="field-input" required value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Bengaluru" />
        </div>
        <div>
          <label className="field-label">Openings</label>
          <input className="field-input" type="number" min="1" required value={form.openings} onChange={(e) => update('openings', Number(e.target.value))} />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select className="field-input" value={form.status} onChange={(e) => update('status', e.target.value)}>
            {JOB_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
}
