import type { StandardField } from './types';

export function suggestFieldMapping(headers: string[]): Record<string, StandardField | ''> {
  const mapping: Record<string, StandardField | ''> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const patterns: Record<StandardField, RegExp[]> = {
    name: [/^name$/, /^full.?name$/, /^contact.?name$/, /^first.?name$/, /^customer.?name$/, /^client.?name$/],
    email: [/^e?mail$/, /^email.?address$/, /^e.?mail.?address$/],
    phone: [/^phone$/, /^phone.?number$/, /^tel$/, /^telephone$/, /^mobile$/, /^contact.?number$/],
    company: [/^company$/, /^company.?name$/, /^organization$/, /^organisation$/, /^org$/, /^business$/],
    date: [/^date$/, /^created.?date$/, /^signup.?date$/, /^join.?date$/, /^added.?date$/, /^date.?added$/, /^date.?created$/],
  };

  const used = new Set<StandardField>();

  for (let i = 0; i < headers.length; i++) {
    const header = lowerHeaders[i];
    let matched: StandardField | '' = '';

    for (const field of Object.keys(patterns) as StandardField[]) {
      if (used.has(field)) continue;
      if (patterns[field].some((p) => p.test(header))) {
        matched = field;
        used.add(field);
        break;
      }
    }

    mapping[headers[i]] = matched;
  }

  return mapping;
}

export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix: number[][] = Array(s1.length + 1)
    .fill(null)
    .map(() => Array(s2.length + 1).fill(0));

  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s1.length][s2.length];
}

export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

export function normalizeForComparison(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s@.-]/g, '');
}
