import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const CandidatesPage = lazy(() => import('./pages/CandidatesPage'));
const CandidateDetailPage = lazy(() => import('./pages/CandidateDetailPage'));

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
        <span className="inline-block size-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
        Loading TalentDesk…
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, ready } = useAuth();

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={user && ready ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
