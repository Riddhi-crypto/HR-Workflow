/**
 * Resume parsing + ATS scoring.
 *
 * This is a *heuristic* parser — real products use NLP services or an LLM.
 * For the prototype we extract with regex + keyword banks, which is enough
 * to demonstrate the auto-fill + scoring UX.
 */

import type { CandidateInfo } from '@/types/workflow';

/* -------------------------------------------------------------------------- */
/*  Keyword banks                                                             */
/* -------------------------------------------------------------------------- */

const TECH_KEYWORDS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Next.js',
  'Node.js',
  'Python',
  'FastAPI',
  'Django',
  'Flask',
  'Java',
  'Spring',
  'Go',
  'Rust',
  'C++',
  'C#',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'Firestore',
  'Redis',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'GraphQL',
  'REST',
  'Tailwind',
  'CSS',
  'HTML',
  'Jest',
  'Cypress',
  'Playwright',
  'Git',
  'CI/CD',
  'Jenkins',
  'GitHub Actions',
  'Redux',
  'Zustand',
  'Vite',
  'Webpack',
  'OAuth',
  'JWT',
  'WebSocket',
  'SSE',
  'Agile',
  'Scrum',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow',
  'PyTorch',
  'LLM',
  'RAG',
];

const SOFT_KEYWORDS = [
  'leadership',
  'teamwork',
  'communication',
  'problem-solving',
  'ownership',
  'initiative',
  'mentorship',
];

const DEGREE_PATTERNS = [
  /\b(B\.?\s?(Tech|E|S|Sc|A)|M\.?\s?(Tech|E|S|Sc|A|BA)|Ph\.?\s?D|Bachelor|Master|Doctorate)\b/i,
];

/* -------------------------------------------------------------------------- */
/*  Parsing                                                                   */
/* -------------------------------------------------------------------------- */

export function parseResumeText(
  text: string,
  jobKeywords: string[] = [],
): CandidateInfo {
  const clean = text.replace(/\r/g, '').trim();

  const name = extractName(clean);
  const email = extractEmail(clean);
  const phone = extractPhone(clean);
  const location = extractLocation(clean);
  const linkedIn = extractLinkedIn(clean);
  const skills = extractSkills(clean);
  const education = extractEducation(clean);
  const experienceYears = estimateExperience(clean);
  const currentRole = extractCurrentRole(clean);

  const { score, matches, missing } = scoreAgainstKeywords(clean, jobKeywords);

  return {
    fullName: name,
    email,
    phone,
    location,
    linkedIn,
    skills,
    education,
    experienceYears,
    currentRole,
    atsScore: score,
    keywordMatches: matches,
    missingKeywords: missing,
  };
}

/* -------------------------------------------------------------------------- */
/*  Field extractors                                                          */
/* -------------------------------------------------------------------------- */

function extractName(text: string): string {
  // Heuristic: the first non-empty line under 60 chars that's not an email.
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (line.includes('@') || line.match(/\d{5,}/)) continue;
    if (line.length > 60) continue;
    if (line.match(/^[A-Z][A-Za-z.'\-\s]{2,}$/)) return line;
  }
  return lines[0] ?? 'Unknown Candidate';
}

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m?.[0] ?? '';
}

function extractPhone(text: string): string {
  const m = text.match(
    /(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,}\d/,
  );
  return (m?.[0] ?? '').trim();
}

function extractLocation(text: string): string {
  const patterns = [
    /(?:Location|Address|Based in|City)[:\s]+([A-Za-z,\s]{3,60})/i,
    /\b(Bengaluru|Bangalore|Mumbai|Delhi|Hyderabad|Chennai|Pune|Kolkata|San Francisco|New York|London|Berlin|Singapore|Remote)\b[,\s]*[A-Za-z]{0,30}/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return (m[1] ?? m[0]).trim().replace(/\n.*$/, '');
  }
  return '';
}

function extractLinkedIn(text: string): string | undefined {
  const m = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_]+/i);
  return m?.[0];
}

function extractSkills(text: string): string[] {
  const found = new Set<string>();
  for (const kw of TECH_KEYWORDS) {
    const re = new RegExp(`\\b${escape(kw)}\\b`, 'i');
    if (re.test(text)) found.add(kw);
  }
  return Array.from(found).slice(0, 24);
}

function extractEducation(text: string): string {
  for (const p of DEGREE_PATTERNS) {
    const m = text.match(p);
    if (m) {
      // Grab surrounding context
      const idx = m.index ?? 0;
      const snippet = text.slice(idx, idx + 120).split('\n')[0];
      return snippet.trim();
    }
  }
  return '';
}

function estimateExperience(text: string): number {
  const explicit = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i);
  if (explicit) return parseInt(explicit[1], 10);

  // Fallback: count "present" / year ranges like "2021 - Present"
  const ranges = text.match(/\b(19|20)\d{2}\s*[-–]\s*(present|current|19|20)/gi);
  if (ranges && ranges.length) return Math.min(ranges.length * 2, 15);

  return 0;
}

function extractCurrentRole(text: string): string | undefined {
  const m = text.match(
    /(?:Current(?:ly)?(?:\s+working)?\s+(?:as|at)|Present\s*[-–:]\s*)([A-Z][A-Za-z\s,&]+?)(?:\n|,|at)/i,
  );
  return m?.[1]?.trim();
}

/* -------------------------------------------------------------------------- */
/*  Scoring                                                                   */
/* -------------------------------------------------------------------------- */

export function scoreAgainstKeywords(
  text: string,
  required: string[],
): { score: number; matches: string[]; missing: string[] } {
  if (!required.length) {
    // Default scoring against the broad tech bank
    const all = [...TECH_KEYWORDS, ...SOFT_KEYWORDS];
    const matches = all.filter((k) =>
      new RegExp(`\\b${escape(k)}\\b`, 'i').test(text),
    );
    const score = Math.min(100, Math.round((matches.length / 10) * 100));
    return { score, matches: matches.slice(0, 15), missing: [] };
  }

  const matches = required.filter((k) =>
    new RegExp(`\\b${escape(k)}\\b`, 'i').test(text),
  );
  const missing = required.filter((k) => !matches.includes(k));
  const score = Math.round((matches.length / required.length) * 100);
  return { score, matches, missing };
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* -------------------------------------------------------------------------- */
/*  Fixture for quick demos when no file is uploaded                          */
/* -------------------------------------------------------------------------- */

export const DEMO_RESUME = `Priya Raman
priya.raman@example.com
+91 98765 43210
Bengaluru, Karnataka
linkedin.com/in/priyaraman

Summary
Full-stack engineer with 4 years of experience building production React/TypeScript
applications and high-throughput Python (FastAPI) backends. Currently a Senior
Software Engineer at Lumen Labs.

Skills
React, TypeScript, Next.js, Node.js, Python, FastAPI, PostgreSQL, Redis, Docker,
Kubernetes, AWS, Tailwind, Jest, Cypress, GraphQL, WebSocket, OAuth, JWT

Experience
Senior Software Engineer — Lumen Labs (2022 - Present)
- Led migration from REST to GraphQL for a 30-service platform.
- Architected the design system used across 14 product teams.

Software Engineer — Notion Clone Inc (2020 - 2022)
- Shipped real-time collaboration features using SSE and WebSockets.

Education
B.Tech, Computer Science — VIT, 2020

Projects
- Open-source contributor to React Flow and MSW.
`;
