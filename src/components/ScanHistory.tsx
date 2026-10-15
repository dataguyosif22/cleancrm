import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ScanRecord } from '@/lib/types';
import { History, Trash2, FileSpreadsheet, ChevronRight } from 'lucide-react';

interface ScanHistoryProps {
  onRefresh?: () => void;
}

export default function ScanHistory() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecords(data as ScanRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('scans').delete().eq('id', id);
    if (!error) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Scan History</h3>
        <span className="text-xs text-slate-400 ml-1">({records.length})</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : records.length === 0 ? (
        <div className="p-8 text-center">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No previous scans yet</p>
          <p className="text-xs text-slate-400 mt-1">Your scan results will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {records.map((record) => (
            <div key={record.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4.5 h-4.5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{record.filename}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatDate(record.created_at)} — {record.total_rows} rows
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{record.issues_count}</div>
                  <div className="text-xs text-slate-400">issues</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${record.clean_percentage >= 80 ? 'text-emerald-600' : record.clean_percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {record.clean_percentage}%
                  </div>
                  <div className="text-xs text-slate-400">clean</div>
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
