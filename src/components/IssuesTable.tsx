import { useState, useMemo } from 'react';
import type { ContactRow, IssueCategory } from '@/lib/types';
import { AlertCircle, Copy, FileWarning, Type, Filter } from 'lucide-react';

interface IssuesTableProps {
  rows: ContactRow[];
  headers: string[];
  fieldMapping: Record<string, string>;
}

const CATEGORY_CONFIG: Record<IssueCategory, { label: string; icon: typeof Copy; color: string; bg: string }> = {
  duplicate: { label: 'Duplicate', icon: Copy, color: 'text-violet-600', bg: 'bg-violet-50' },
  missing: { label: 'Missing Field', icon: FileWarning, color: 'text-orange-600', bg: 'bg-orange-50' },
  invalid: { label: 'Invalid Format', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  formatting: { label: 'Formatting', icon: Type, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function IssuesTable({ rows, headers, fieldMapping }: IssuesTableProps) {
  const [filter, setFilter] = useState<IssueCategory | 'all'>('all');

  const flaggedRows = useMemo(() => rows.filter((r) => r.issues.length > 0), [rows]);

  const filteredRows = useMemo(() => {
    if (filter === 'all') return flaggedRows;
    return flaggedRows.filter((r) => r.issues.some((i) => i.category === filter));
  }, [flaggedRows, filter]);

  const mappedHeaders = headers.filter((h) => fieldMapping[h] && fieldMapping[h] !== '');

  const filterOptions: { value: IssueCategory | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All Issues', count: flaggedRows.length },
    { value: 'duplicate', label: 'Duplicates', count: rows.filter((r) => r.issues.some((i) => i.category === 'duplicate')).length },
    { value: 'missing', label: 'Missing Fields', count: rows.filter((r) => r.issues.some((i) => i.category === 'missing')).length },
    { value: 'invalid', label: 'Invalid Format', count: rows.filter((r) => r.issues.some((i) => i.category === 'invalid')).length },
    { value: 'formatting', label: 'Formatting', count: rows.filter((r) => r.issues.some((i) => i.category === 'formatting')).length },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filter by issue type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === opt.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
              <span className={`ml-1.5 text-xs ${filter === opt.value ? 'text-slate-300' : 'text-slate-400'}`}>
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-400 text-sm">No issues in this category</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                  Row
                </th>
                {mappedHeaders.map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {fieldMapping[header]}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.rowIndex} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                    {row.rowIndex + 1}
                  </td>
                  {mappedHeaders.map((header) => (
                    <td key={header} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {row.raw[header] || <span className="text-slate-300 italic">empty</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.issues.map((issue, idx) => {
                        const config = CATEGORY_CONFIG[issue.category];
                        const Icon = config.icon;
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1.5 ${config.bg} ${config.color} px-2 py-1 rounded-md text-xs font-medium`}
                          >
                            <Icon className="w-3 h-3" />
                            {issue.message}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
