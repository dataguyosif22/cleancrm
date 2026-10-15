import { useState, useCallback } from 'react';
import { parseCSV, rowsToObjects } from '@/lib/csv';
import { suggestFieldMapping } from '@/lib/matching';
import type { StandardField } from '@/lib/types';
import { FIELD_LABELS, STANDARD_FIELDS } from '@/lib/types';
import { UploadCloud, FileSpreadsheet, ArrowRight, Check } from 'lucide-react';

interface UploadScreenProps {
  onParsed: (data: {
    headers: string[];
    objects: Record<string, string>[];
    fieldMapping: Record<string, string>;
    filename: string;
  }) => void;
}

export default function UploadScreen({ onParsed }: UploadScreenProps) {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [objects, setObjects] = useState<Record<string, string>[]>([]);
  const [filename, setFilename] = useState('');
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        setError('The CSV file appears to be empty or invalid');
        return;
      }
      const objs = rowsToObjects(headers, rows);
      const suggested = suggestFieldMapping(headers);
      setHeaders(headers);
      setObjects(objs);
      setFilename(file.name);
      setFieldMapping(suggested);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleMappingChange = (header: string, value: string) => {
    setFieldMapping((prev) => ({ ...prev, [header]: value }));
  };

  const handleConfirm = () => {
    onParsed({ headers, objects, fieldMapping, filename });
  };

  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragOver
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <p className="text-slate-900 font-medium">Drop your CSV file here</p>
              <p className="text-slate-500 text-sm mt-1">or click to browse</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <span className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
                <FileSpreadsheet className="w-4 h-4" />
                Select CSV File
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">What to expect</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Map your column headers to standard fields (name, email, phone, company, date)
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Automatic duplicate detection using fuzzy matching
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Missing fields, invalid emails, malformed phones, and formatting issues flagged
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Download flagged and cleaned versions of your data
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Mapping step
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-5 h-5 text-slate-500" />
          <span className="text-sm text-slate-500">{filename}</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Map your columns</h2>
        <p className="text-sm text-slate-500 mb-6">
          We detected {objects.length} rows. Match your column headers to the standard fields below.
        </p>

        <div className="space-y-3">
          {headers.map((header) => (
            <div key={header} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 truncate">
                  {header}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <select
                  value={fieldMapping[header] ?? ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
                >
                  <option value="">— Skip —</option>
                  {STANDARD_FIELDS.map((field) => (
                    <option key={field} value={field}>{FIELD_LABELS[field]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            Run Audit
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
