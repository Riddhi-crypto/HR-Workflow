/**
 * Top bar — branding, workflow title, and primary actions.
 */

import { useRef } from 'react';
import {
  Workflow,
  FileUp,
  PlayCircle,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWorkflow } from '@/store/workflowStore';

interface Props {
  onOpenATS: () => void;
  onOpenSimulator: () => void;
}

export function TopBar({ onOpenATS, onOpenSimulator }: Props) {
  const { exportJSON, loadWorkflow, resetWorkflow, candidate } = useWorkflow();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (f: File) => {
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        loadWorkflow(parsed.nodes, parsed.edges);
      } else {
        alert('Invalid workflow file');
      }
    } catch {
      alert('Could not parse file');
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-200 bg-white px-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950 text-white">
          <Workflow size={14} strokeWidth={2.5} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[18px] font-bold tracking-tight text-ink-900">
            Hirelow
          </span>
          <span className="hidden text-[11px] font-mono text-ink-400 md:inline">
            HR · Workflow Designer
          </span>
        </div>
      </div>

      {/* Workflow name */}
      <div className="hidden items-center gap-1.5 md:flex">
        <span className="text-[13px] font-semibold text-ink-900">
          Software Engineering · Full-time
        </span>
        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          Draft
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
          }}
        />
        <Button
          icon={<RefreshCw size={13} />}
          onClick={() => {
            if (confirm('Reset workflow to starter template?')) resetWorkflow();
          }}
        >
          Reset
        </Button>
        <Button icon={<Upload size={13} />} onClick={() => importRef.current?.click()}>
          Import
        </Button>
        <Button icon={<Download size={13} />} onClick={handleExport}>
          Export
        </Button>
        <div className="mx-1 h-5 w-px bg-ink-200" />
        <Button
          icon={<FileUp size={13} />}
          onClick={onOpenATS}
          className={candidate ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : ''}
        >
          {candidate ? `ATS · ${candidate.atsScore ?? 0}` : 'ATS Resume Check'}
        </Button>
        <Button
          variant="accent"
          icon={<PlayCircle size={13} />}
          onClick={onOpenSimulator}
        >
          Run Simulation
        </Button>
      </div>
    </header>
  );
}
