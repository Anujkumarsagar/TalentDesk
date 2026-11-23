import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

const suggestions = [
  'How many candidates are in Interviewed for the Python Developer job?',
  'List selected candidates who can join within 30 days',
  'Summarize the Python Developer job',
];

const docTone = {
  PENDING: 'bg-amber-50 text-amber-700',
  PROCESSING: 'bg-sky-50 text-sky-700',
  READY: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-rose-50 text-rose-600',
};

export default function ChatPanel({ open, onClose }) {
  const { isRecruiter } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([{
    id: 1,
    role: 'assistant',
    text: 'Hi! I can answer questions from your jobs and candidates, or from uploaded documents like hiring policies and JDs. What would you like to know?',
    sources: [],
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  function refreshDocuments() {
    api.documents.list().then((data) => setDocuments(data.documents || [])).catch(() => {});
  }

  useEffect(() => { if (open) refreshDocuments(); }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  async function send(message) {
    const text = message.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text }]);
    setLoading(true);
    try {
      const answer = await api.chat.ask(text);
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: 'assistant',
        text: answer.answer,
        sources: answer.sources || [],
        mode: answer.mode,
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: 'assistant',
        text: error.message,
        sources: [],
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setUploading(true);
    try {
      const { document: uploaded } = await api.documents.upload(file);
      toast('File uploaded — indexing in the background');
      refreshDocuments();
      pollDocument(uploaded.id);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  function pollDocument(id, attempt = 0) {
    if (attempt > 20) return;
    setTimeout(async () => {
      try {
        const { document: updated } = await api.documents.get(id);
        setDocuments((current) => current.map((doc) => (doc.id === id ? updated : doc)));
        if (updated.status === 'READY') toast('Document ready for questions');
        if (updated.status === 'FAILED') toast(updated.errorMessage || 'Document processing failed', 'error');
        if (!['READY', 'FAILED'].includes(updated.status)) pollDocument(id, attempt + 1);
      } catch { /* polling can fail transiently */ }
    }, 2000);
  }

  async function handleDeleteDocument(doc) {
    if (!window.confirm(`Remove ${doc.originalName}?`)) return;
    try {
      await api.documents.remove(doc.id);
      refreshDocuments();
      toast('Document removed');
    } catch (error) { toast(error.message, 'error'); }
  }

  if (!open) return null;

  return (
    <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} className="fixed inset-y-0 right-0 z-90 flex w-full max-w-105 flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }} className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-cyan-400 text-white"><Icon name="sparkles" size={19} /></motion.div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-ink">TalentDesk Assistant</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-600"><span className="size-1.5 rounded-full bg-emerald-500" /> Ready to help</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink" aria-label="Close chat"><Icon name="x" size={18} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-5">
        {messages.map((message) => (
          <motion.div key={message.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 340, damping: 26 }} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`grid size-7 shrink-0 place-items-center rounded-lg ${message.role === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
              <Icon name={message.role === 'user' ? 'user' : 'sparkles'} size={14} />
            </div>
            <div className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${message.role === 'user' ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-ink'}`}>
              {message.error && <span className="mr-1 font-bold text-rose-600">Error:</span>}
              <span className="whitespace-pre-wrap break-words">{message.text}</span>
              {message.mode && (
                <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {message.mode === 'data' ? 'App data' : message.mode === 'docs' ? 'Documents' : 'No answer'}
                </span>
              )}
              {message.sources?.length > 0 && (
                <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5">
                  <div className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Sources</div>
                  {message.sources.map((source, index) => (
                    <div key={index} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <Icon name="file" size={12} className="mt-0.5 shrink-0 text-brand-500" />
                      <span>{source.citation || `${source.filename}${source.page ? ` (page ${source.page})` : ` (chunk ${source.chunkIndex + 1})`}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon name="sparkles" size={14} /></div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3">
              {[0, 1, 2].map((dot) => <span key={dot} className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${dot * 120}ms` }} />)}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-3">
          {suggestions.map((question, index) => <motion.button key={question} type="button" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => send(question)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{question}</motion.button>)}
        </div>
      )}

      <div className="border-t border-slate-200 px-4 pt-3 pb-4">
        <div className="mb-2.5 flex items-center gap-2">
          {isRecruiter ? (
            <>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" className="hidden" onChange={handleUpload} />
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[11px] font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-50">
                <Icon name={uploading ? 'refresh' : 'upload'} size={13} className={uploading ? 'animate-spin' : ''} /> {uploading ? 'Uploading…' : 'Upload PDF / TXT'}
              </motion.button>
              <button type="button" onClick={() => setShowDocs((value) => !value)} className="text-[11px] font-semibold text-slate-500 hover:text-brand-600">
                Knowledge base ({documents.length}) {showDocs ? '▴' : '▾'}
              </button>
            </>
          ) : (
            <span className="text-[11px] text-slate-500">Read-only mode — you can ask questions but not upload files.</span>
          )}
        </div>

        {showDocs && (
          <div className="mb-3 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
            {documents.length === 0 && <p className="px-1 py-2 text-[11px] text-slate-500">No documents uploaded yet.</p>}
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5">
                <Icon name="file" size={13} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink" title={doc.originalName}>{doc.originalName}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${docTone[doc.status] || docTone.PENDING}`}>{doc.status.toLowerCase()}</span>
                {isRecruiter && <button type="button" onClick={() => handleDeleteDocument(doc)} className="text-slate-400 hover:text-rose-600" aria-label="Delete document"><Icon name="trash" size={12} /></button>}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            rows="1"
            className="max-h-30 min-h-10.5 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-[13px] outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
            placeholder="Ask about candidates, jobs, or documents…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(input); }
            }}
          />
          <motion.button whileHover={{ scale: 1.06, rotate: -6 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => send(input)} disabled={!input.trim() || loading} className="grid size-10.5 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40" aria-label="Send message">
            <Icon name="send" size={16} />
          </motion.button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">Answers are grounded in your app data and uploaded documents.</p>
      </div>
    </motion.aside>
  );
}
