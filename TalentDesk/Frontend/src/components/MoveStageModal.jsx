import { useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { Badge, Modal, STAGES, label, stageTone } from './Ui';
import Icon from './Icon';
import { useToast } from '../context/ToastContext';

export default function MoveStageModal({ candidate, onClose, onMoved }) {
  const toast = useToast();
  const [toStage, setToStage] = useState(STAGES.find((stage) => stage !== candidate.stage) || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.candidates.moveStage(candidate.id, toStage);
      toast(`${candidate.name} moved to ${label(toStage)}`);
      onMoved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Move stage" subtitle={candidate.name} onClose={onClose} width="max-w-md" footer={
      <>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit" form="move-form" className="btn-primary" disabled={saving || !toStage}>{saving ? 'Moving…' : 'Move candidate'}</motion.button>
      </>
    }>
      {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</div>}
      <form id="move-form" onSubmit={handleSubmit}>
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
          <div className="grid size-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><Icon name="users" size={18} /></div>
          <div>
            <div className="text-sm font-bold">{candidate.name}</div>
            <div className="mt-1"><Badge tone={stageTone(candidate.stage)}>{label(candidate.stage)}</Badge></div>
          </div>
        </div>
        <label className="field-label">Move to</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {STAGES.filter((stage) => stage !== candidate.stage).map((stage) => (
            <motion.button key={stage} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => setToStage(stage)} className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold transition ${toStage === stage ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/15' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {label(stage)}
              {toStage === stage && <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }}><Icon name="check" size={15} /></motion.span>}
            </motion.button>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-sky-800">
          <Icon name="history" size={14} className="mt-0.5 shrink-0" />
          This creates an immutable stage-history event with your name and timestamp.
        </p>
      </form>
    </Modal>
  );
}
