export type IssueCategory = 'duplicate' | 'missing' | 'invalid' | 'formatting';

export interface Issue {
  rowIndex: number;
  category: IssueCategory;
  message: string;
  field: string;
}

export interface ContactRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    date?: string;
  };
  issues: Issue[];
  isDuplicate: boolean;
  duplicateGroup?: number;
}

export interface ScanSummary {
  totalRows: number;
  issuesCount: number;
  duplicateCount: number;
  cleanPercentage: number;
  categoryCounts: Record<IssueCategory, number>;
}

export interface ScanResult {
  summary: ScanSummary;
  rows: ContactRow[];
  headers: string[];
  fieldMapping: Record<string, string>;
}

export interface ScanRecord {
  id: string;
  filename: string;
  total_rows: number;
  issues_count: number;
  duplicate_count: number;
  clean_percentage: number;
  category_counts: Record<string, number>;
  created_at: string;
}

export const STANDARD_FIELDS = ['name', 'email', 'phone', 'company', 'date'] as const;
export type StandardField = (typeof STANDARD_FIELDS)[number];

export const FIELD_LABELS: Record<StandardField, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  date: 'Date',
};
