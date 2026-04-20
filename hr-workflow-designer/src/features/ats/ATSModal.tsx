/**
 * ATS Resume Checker modal.
 *
 * Flow:
 *   1. User drops a .txt / .pdf / .docx file or pastes resume text
 *      (for this prototype we read plain text; PDF/docx would be handled
 *      by a backend service in production).
 *   2. We parse the text into a CandidateInfo object.
 *   3. Score is computed against keywords pulled from every ATS node
 *      currently on the canvas.
 *   4. Result is displayed + stored on the workflow store so the
 *      simulator panel shows it.
 */

import { useRef, useState } from 'react';
import {
  FileUp,
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWorkflow } from '@/store/workflowStore';
import { parseResumeText, DEMO_RESUME } from '@/features/ats/resumeParser';
import type { ATSNodeData, CandidateInfo } from '@/types/workflow';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ATSModal({ open, onClose }: Props) {
  const { nodes, setCandidate, candidate } = useWorkflow();
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  // Aggregate all ATS-node keywords as the scoring target
  const jobKeywords = Array.from(
    new Set(
      nodes
        .filter((n) => n.data.kind === 'ats')
        .flatMap((n) => (n.data as ATSNodeData).requiredKeywords),
    ),
  );

  const minScore = Math.min(
    ...nodes
      .filter((n) => n.data.kind === 'ats')
      .map((n) => (n.data as ATSNodeData).minScore),
    100,
  );

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setIsParsing(true);
    try {
      const text = await file.text();
      setResumeText(text);
      await runParse(text);
    } catch {
      alert('Could not read file — please paste the text instead.');
      setIsParsing(false);
    }
  };

  const runParse = async (text: string) => {
    setIsParsing(true);
    // Simulate a bit of latency to make the spinner feel real
    await new Promise((r) => setTimeout(r, 600));
    const parsed = parseResumeText(text, jobKeywords);
    setCandidate(parsed);
    setIsParsing(false);
  };

  const loadDemo = () => {
    setResumeText(DEMO_RESUME);
    setFileName('priya_raman_resume.txt');
    runParse(DEMO_RESUME);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-[860px] overflow-hidden rounded-2xl bg-white shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — Upload */}
        <div className="flex w-[46%] flex-col border-r border-ink-200 bg-ink-50/40">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent">
                ATS
              </div>
              <h2 className="mt-0.5 font-display text-[20px] font-semibold tracking-tight text-ink-900">
                Resume Checker
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
            >
              <X size={18} />
            </button>
          </div>

          <div className="custom-scroll flex-1 overflow-y-auto p-5">
            <label
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-white py-7 transition-colors hover:border-accent hover:bg-accent-soft/30"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                <FileUp size={18} />
              </div>
              <div className="text-center">
                <div className="text-[13px] font-semibold text-ink-900">
                  Drop resume file
                </div>
                <div className="text-[11.5px] text-ink-500">
                  .txt supported · PDF/DOCX via paste
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>

            <div className="my-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-400">
              <span className="h-px flex-1 bg-ink-200" />
              or
              <span className="h-px flex-1 bg-ink-200" />
            </div>

            <textarea
              className="field-textarea h-44 font-mono text-[11.5px]"
              placeholder="Paste resume text here…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />

            <div className="mt-3 flex gap-2">
              <Button
                variant="accent"
                icon={
                  isParsing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )
                }
                disabled={!resumeText.trim() || isParsing}
                onClick={() => runParse(resumeText)}
              >
                {isParsing ? 'Parsing…' : 'Auto-fill from resume'}
              </Button>
              <Button icon={<Wand2 size={13} />} onClick={loadDemo}>
                Load demo resume
              </Button>
            </div>

            {fileName && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-[11.5px] text-ink-600">
                <FileText size={13} className="text-ink-400" />
                <span className="font-mono">{fileName}</span>
              </div>
            )}

            {jobKeywords.length > 0 && (
              <div className="mt-4 rounded-lg border border-ink-200 bg-white p-3">
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
                  Target Keywords (from ATS nodes)
                </div>
                <div className="flex flex-wrap gap-1">
                  {jobKeywords.map((k) => (
                    <span
                      key={k}
                      className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-ink-500">
                  Minimum pass score:{' '}
                  <span className="font-semibold text-ink-900">{minScore}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Results / Candidate Info */}
        <div className="flex w-[54%] flex-col">
          {candidate ? (
            <CandidateResult
              candidate={candidate}
              minScore={minScore}
              onClear={() => setCandidate(null)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
                <Sparkles size={20} className="text-ink-400" />
              </div>
              <h3 className="font-display text-[17px] font-semibold text-ink-900">
                Candidate info appears here
              </h3>
              <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-ink-500">
                Drop or paste a resume and we'll auto-extract contact details,
                skills, education, and score them against the job's keywords.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CandidateResult({
  candidate,
  minScore,
  onClear,
}: {
  candidate: CandidateInfo;
  minScore: number;
  onClear: () => void;
}) {
  const score = candidate.atsScore ?? 0;
  const passes = score >= minScore;

  return (
    <>
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Extracted candidate
          </div>
          <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-tight text-ink-900">
            {candidate.fullName}
          </h2>
        </div>
        <Button icon={<X size={13} />} onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto p-5">
        {/* Score gauge */}
        <div
          className={`mb-4 rounded-xl border p-4 ${
            passes
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-red-200 bg-red-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
                ATS Score
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 font-display">
                <span
                  className={`text-[44px] font-bold leading-none ${
                    passes ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {score}
                </span>
                <span className="text-[18px] text-ink-400">/ 100</span>
              </div>
              <div className="mt-1 text-[11.5px] text-ink-500">
                Pass threshold: {minScore}
              </div>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                passes
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {passes ? (
                <CheckCircle2 size={13} strokeWidth={2.5} />
              ) : (
                <XCircle size={13} strokeWidth={2.5} />
              )}
              {passes ? 'Qualified' : 'Below bar'}
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
            <div
              className={`h-full rounded-full ${
                passes ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>

        {/* Contact */}
        <Section title="Contact">
          <InfoRow label="Email" value={candidate.email || '—'} mono />
          <InfoRow label="Phone" value={candidate.phone || '—'} mono />
          <InfoRow label="Location" value={candidate.location || '—'} />
          {candidate.linkedIn && (
            <InfoRow label="LinkedIn" value={candidate.linkedIn} mono />
          )}
        </Section>

        {/* Professional */}
        <Section title="Professional">
          <InfoRow
            label="Experience"
            value={`${candidate.experienceYears} year${
              candidate.experienceYears === 1 ? '' : 's'
            }`}
          />
          {candidate.currentRole && (
            <InfoRow label="Current role" value={candidate.currentRole} />
          )}
          <InfoRow label="Education" value={candidate.education || '—'} />
        </Section>

        {/* Skills */}
        {candidate.skills.length > 0 && (
          <Section title={`Skills (${candidate.skills.length})`}>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Keyword match */}
        {(candidate.keywordMatches?.length || candidate.missingKeywords?.length) ? (
          <Section title="Keyword match">
            {candidate.keywordMatches && candidate.keywordMatches.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 text-[11px] font-semibold text-emerald-700">
                  Matched
                </div>
                <div className="flex flex-wrap gap-1">
                  {candidate.keywordMatches.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"
                    >
                      <CheckCircle2 size={10} /> {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {candidate.missingKeywords && candidate.missingKeywords.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-semibold text-red-700">
                  Missing
                </div>
                <div className="flex flex-wrap gap-1">
                  {candidate.missingKeywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700"
                    >
                      <XCircle size={10} /> {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        ) : null}
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink-100 py-1 last:border-0">
      <span className="text-[11.5px] text-ink-500">{label}</span>
      <span
        className={`truncate text-right text-[12.5px] text-ink-900 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
