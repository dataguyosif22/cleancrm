import type { ContactRow, Issue, IssueCategory, ScanResult, ScanSummary, StandardField } from './types';
import { normalizeForComparison, stringSimilarity } from './matching';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/;

const DUPLICATE_SIMILARITY_THRESHOLD = 0.85;

function isEmailValid(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function isPhoneValid(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned === '') return false;
  return PHONE_REGEX.test(phone);
}

function isTitleCase(s: string): boolean {
  // Check if string is in title case (each word capitalized) or all caps (common for companies)
  return s === s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() ||
    s === s.toUpperCase() ||
    s.split(/\s+/).every((w) => w === '' || w === w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function detectDateFormats(s: string): string[] {
  const formats: string[] = [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) formats.push('YYYY-MM-DD');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) formats.push('DD/MM/YYYY');
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(s)) formats.push('DD/MM/YY');
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) formats.push('M/D/YYYY');
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) formats.push('M-D-YYYY');
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) formats.push('YYYY/MM/DD');
  if (/^[A-Za-z]{3,9}\s\d{1,2},?\s\d{4}$/.test(s)) formats.push('Month DD, YYYY');
  return formats;
}

function detectDuplicates(rows: ContactRow[]): void {
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i].mapped;
      const b = rows[j].mapped;

      const nameA = normalizeForComparison(a.name ?? '');
      const nameB = normalizeForComparison(b.name ?? '');
      const emailA = normalizeForComparison(a.email ?? '');
      const emailB = normalizeForComparison(b.email ?? '');
      const companyA = normalizeForComparison(a.company ?? '');
      const companyB = normalizeForComparison(b.company ?? '');

      let isDup = false;

      // Exact or near-exact email match
      if (emailA && emailB && emailA === emailB) {
        isDup = true;
      }

      // Fuzzy name + email
      if (!isDup && nameA && nameB && emailA && emailB) {
        const nameSim = stringSimilarity(nameA, nameB);
        const emailSim = stringSimilarity(emailA, emailB);
        if (nameSim >= DUPLICATE_SIMILARITY_THRESHOLD && emailSim >= 0.9) {
          isDup = true;
        }
      }

      // Fuzzy name + company
      if (!isDup && nameA && nameB) {
        const nameSim = stringSimilarity(nameA, nameB);
        if (nameSim >= 0.9 && companyA && companyB) {
          const companySim = stringSimilarity(companyA, companyB);
          if (companySim >= DUPLICATE_SIMILARITY_THRESHOLD) {
            isDup = true;
          }
        }
      }

      // Exact name + company
      if (!isDup && nameA && nameB && nameA === nameB) {
        if (companyA && companyB && companyA === companyB) {
          isDup = true;
        }
        if (!companyA && !companyB && emailA && emailB && emailA === emailB) {
          isDup = true;
        }
      }

      if (isDup) {
        rows[i].isDuplicate = true;
        rows[j].isDuplicate = true;

        // Assign to same group
        if (rows[i].duplicateGroup !== undefined && rows[j].duplicateGroup !== undefined) {
          // merge groups
          const minGroup = Math.min(rows[i].duplicateGroup!, rows[j].duplicateGroup!);
          const maxGroup = Math.max(rows[i].duplicateGroup!, rows[j].duplicateGroup!);
          rows.forEach((r) => {
            if (r.duplicateGroup === maxGroup) r.duplicateGroup = minGroup;
          });
        } else if (rows[i].duplicateGroup !== undefined) {
          rows[j].duplicateGroup = rows[i].duplicateGroup;
        } else if (rows[j].duplicateGroup !== undefined) {
          rows[i].duplicateGroup = rows[j].duplicateGroup;
        } else {
          const groupNum = Math.max(0, ...rows.filter((r) => r.duplicateGroup !== undefined).map((r) => r.duplicateGroup!)) + 1;
          rows[i].duplicateGroup = groupNum;
          rows[j].duplicateGroup = groupNum;
        }
      }
    }
  }
}

function checkRow(row: ContactRow, fieldMapping: Record<string, string>): Issue[] {
  const issues: Issue[] = [];
  const m = row.mapped;

  // Missing required fields (name and email are required)
  if (!m.name || m.name.trim() === '') {
    issues.push({ rowIndex: row.rowIndex, category: 'missing', field: 'name', message: 'Name is blank' });
  }
  if (!m.email || m.email.trim() === '') {
    issues.push({ rowIndex: row.rowIndex, category: 'missing', field: 'email', message: 'Email is blank' });
  }

  // Invalid email
  if (m.email && m.email.trim() !== '' && !isEmailValid(m.email)) {
    issues.push({ rowIndex: row.rowIndex, category: 'invalid', field: 'email', message: `Email "${m.email}" is not a valid email format` });
  }

  // Invalid phone (only if phone is present)
  if (m.phone && m.phone.trim() !== '' && !isPhoneValid(m.phone)) {
    issues.push({ rowIndex: row.rowIndex, category: 'invalid', field: 'phone', message: `Phone "${m.phone}" is not a valid phone number` });
  }

  // Formatting: inconsistent casing in names
  if (m.name && m.name.trim() !== '' && !isTitleCase(m.name)) {
    issues.push({ rowIndex: row.rowIndex, category: 'formatting', field: 'name', message: `Name "${m.name}" has inconsistent capitalization` });
  }

  // Formatting: inconsistent casing in companies
  if (m.company && m.company.trim() !== '' && !isTitleCase(m.company)) {
    issues.push({ rowIndex: row.rowIndex, category: 'formatting', field: 'company', message: `Company "${m.company}" has inconsistent capitalization` });
  }

  // Formatting: date format check
  if (m.date && m.date.trim() !== '') {
    const formats = detectDateFormats(m.date.trim());
    if (formats.length === 0) {
      issues.push({ rowIndex: row.rowIndex, category: 'invalid', field: 'date', message: `Date "${m.date}" is not in a recognized format` });
    }
  }

  return issues;
}

export function runAudit(
  objects: Record<string, string>[],
  headers: string[],
  fieldMapping: Record<string, string>
): ScanResult {
  const rows: ContactRow[] = objects.map((obj, i) => {
    const mapped: ContactRow['mapped'] = {};
    for (const [header, field] of Object.entries(fieldMapping)) {
      if (field) {
        mapped[field as StandardField] = obj[header] ?? '';
      }
    }
    return {
      rowIndex: i,
      raw: obj,
      mapped,
      issues: [],
      isDuplicate: false,
    };
  });

  // Detect duplicates
  detectDuplicates(rows);

  // Add duplicate issues
  for (const row of rows) {
    if (row.isDuplicate) {
      row.issues.push({
        rowIndex: row.rowIndex,
        category: 'duplicate',
        field: 'name',
        message: `Likely duplicate of another row${row.duplicateGroup !== undefined ? ` (group ${row.duplicateGroup})` : ''}`,
      });
    }
  }

  // Run field-level checks
  for (const row of rows) {
    const fieldIssues = checkRow(row, fieldMapping);
    row.issues.push(...fieldIssues);
  }

  // Build summary
  const categoryCounts: Record<IssueCategory, number> = {
    duplicate: 0,
    missing: 0,
    invalid: 0,
    formatting: 0,
  };

  for (const row of rows) {
    for (const issue of row.issues) {
      categoryCounts[issue.category]++;
    }
  }

  const totalRows = rows.length;
  const issuesCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const rowsWithIssues = rows.filter((r) => r.issues.length > 0).length;
  const cleanPercentage = totalRows > 0 ? Math.round(((totalRows - rowsWithIssues) / totalRows) * 100) : 0;

  const summary: ScanSummary = {
    totalRows,
    issuesCount,
    duplicateCount,
    cleanPercentage,
    categoryCounts,
  };

  return { summary, rows, headers, fieldMapping };
}

export function buildFlaggedCSV(rows: ContactRow[], headers: string[]): { headers: string[]; data: Record<string, string>[] } {
  const outHeaders = [...headers, 'issue'];
  const data = rows.map((row) => {
    const obj: Record<string, string> = { ...row.raw };
    obj['issue'] = row.issues.length > 0
      ? row.issues.map((i) => i.message).join('; ')
      : '';
    return obj;
  });
  return { headers: outHeaders, data };
}

function toTitleCase(s: string): string {
  return s.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function buildCleanedCSV(rows: ContactRow[], headers: string[], fieldMapping: Record<string, string>): { headers: string[]; data: Record<string, string>[] } {
  const outHeaders = [...headers, 'cleaned'];
  const data = rows.map((row) => {
    const obj: Record<string, string> = { ...row.raw };

    // Trim whitespace on all fields
    for (const h of headers) {
      obj[h] = obj[h].trim();
    }

    // Apply standard field fixes
    for (const [header, field] of Object.entries(fieldMapping)) {
      if (!field || field === '') continue;
      const val = obj[header];
      if (!val) continue;

      if (field === 'name' || field === 'company') {
        // Standardize casing to title case
        if (val !== val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() && val !== val.toUpperCase()) {
          obj[header] = toTitleCase(val);
        }
      }
      if (field === 'email') {
        obj[header] = val.toLowerCase().trim();
      }
    }

    // Mark duplicates for manual review
    obj['cleaned'] = row.isDuplicate
      ? 'Duplicate - review manually'
      : row.issues.some((i) => i.category === 'missing')
        ? 'Missing required field - review'
        : row.issues.some((i) => i.category === 'invalid')
          ? 'Invalid format - review'
          : 'Clean';

    return obj;
  });
  return { headers: outHeaders, data };
}
