import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import UploadScreen from '@/components/UploadScreen';
import Dashboard from '@/components/Dashboard';
import ScanHistory from '@/components/ScanHistory';
import { runAudit } from '@/lib/audit';
import type { ScanResult } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, LogOut, FileSpreadsheet } from 'lucide-react';

type View = 'upload' | 'dashboard';

function MainApp() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('upload');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [filename, setFilename] = useState('');
  const [historyKey, setHistoryKey] = useState(0);

  const handleParsed = async (data: {
    headers: string[];
    objects: Record<string, string>[];
    fieldMapping: Record<string, string>;
    filename: string;
  }) => {
    const scanResult = runAudit(data.objects, data.headers, data.fieldMapping);
    setResult(scanResult);
    setFilename(data.filename);
    setView('dashboard');

    // Save scan to history
    if (user) {
      await supabase.from('scans').insert({
        filename: data.filename,
        total_rows: scanResult.summary.totalRows,
        issues_count: scanResult.summary.issuesCount,
        duplicate_count: scanResult.summary.duplicateCount,
        clean_percentage: scanResult.summary.cleanPercentage,
        category_counts: scanResult.summary.categoryCounts,
      });
      setHistoryKey((k) => k + 1);
    }
  };

  const handleNewScan = () => {
    setResult(null);
    setView('upload');
    setHistoryKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">CleanCRM</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Contact Data Auditor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {view === 'upload' && <UploadScreen onParsed={handleParsed} />}
            {view === 'dashboard' && result && (
              <Dashboard result={result} filename={filename} onNewScan={handleNewScan} />
            )}
          </div>
          <aside>
            <ScanHistory key={historyKey} />
          </aside>
        </div>

        {view === 'upload' && (
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV upload only — CRM API integrations coming soon
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  return <MainApp />;
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
