import { useMemo, useState } from 'react';
import type { ScanResult } from '@/lib/types';
import { buildFlaggedCSV, buildCleanedCSV } from '@/lib/audit';
import { objectsToCSV, downloadCSV } from '@/lib/csv';
import StatCard from './StatCard';
import IssuesTable from './IssuesTable';
import { FileSpreadsheet, AlertTriangle, Copy, CheckCircle2, Download, FileDown, FileCheck2 } from 'lucide-react';

interface DashboardProps {
  result: ScanResult;
  filename: string;
  onNewScan: () => void;
}

export default function Dashboard({ result, filename, onNewScan }: DashboardProps) {
  const { summary, rows, headers, fieldMapping } = result;
  const [downloading, setDownloading] = useState(false);

  const flaggedData = useMemo(() => buildFlaggedCSV(rows, headers), [rows, headers]);
  const cleanedData = useMemo(() => buildCleanedCSV(rows, headers, fieldMapping), [rows, headers, fieldMapping]);

  const handleDownloadFlagged = () => {
    const csv = objectsToCSV(flaggedData.headers, flaggedData.data);
    downloadCSV(`flagged_${filename.replace('.csv', '')}.csv`, csv);
  };

  const handleDownloadCleaned = () => {
    const csv = objectsToCSV(cleanedData.headers, cleanedData.data);
    downloadCSV(`cleaned_${filename.replace('.csv', '')}.csv`, csv);
  };

  const handleDownloadBoth = () => {
    setDownloading(true);
    handleDownloadFlagged();
    setTimeout(() => {
      handleDownloadCleaned();
      setDownloading(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Results</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filename} — {summary.totalRows} rows scanned
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadFlagged}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            <FileDown className="w-4 h-4" />
            Flagged CSV
          </button>
          <button
            onClick={handleDownloadCleaned}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            Cleaned CSV
          </button>
          <button
            onClick={handleDownloadBoth}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Both
          </button>
          <button
            onClick={onNewScan}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            New Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Rows"
          value={summary.totalRows}
          icon={FileSpreadsheet}
          color="slate"
          subtitle="Contacts scanned"
        />
        <StatCard
          label="Issues Found"
          value={summary.issuesCount}
          icon={AlertTriangle}
          color="amber"
          subtitle={`${summary.categoryCounts.missing + summary.categoryCounts.invalid} field problems`}
        />
        <StatCard
          label="Duplicates"
          value={summary.duplicateCount}
          icon={Copy}
          color="red"
          subtitle="Likely duplicate rows"
        />
        <StatCard
          label="Clean"
          value={`${summary.cleanPercentage}%`}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Rows with no issues"
        />
      </div>

      {summary.issuesCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
            <div className="text-xs font-medium text-violet-600 mb-0.5">Duplicates</div>
            <div className="text-lg font-bold text-violet-700">{summary.categoryCounts.duplicate}</div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
            <div className="text-xs font-medium text-orange-600 mb-0.5">Missing Fields</div>
            <div className="text-lg font-bold text-orange-700">{summary.categoryCounts.missing}</div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <div className="text-xs font-medium text-red-600 mb-0.5">Invalid Format</div>
            <div className="text-lg font-bold text-red-700">{summary.categoryCounts.invalid}</div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <div className="text-xs font-medium text-blue-600 mb-0.5">Formatting</div>
            <div className="text-lg font-bold text-blue-700">{summary.categoryCounts.formatting}</div>
          </div>
        </div>
      )}

      <IssuesTable rows={rows} headers={headers} fieldMapping={fieldMapping} />
    </div>
  );
}
