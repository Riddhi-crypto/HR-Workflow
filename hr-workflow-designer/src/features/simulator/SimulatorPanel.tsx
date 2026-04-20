/**
 * Simulation sandbox.
 *
 * Serialises the workflow graph, POSTs it to the mock /simulate endpoint,
 * and renders a step-by-step execution timeline.
 */

import { useState } from 'react';
import {
  Play,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Ban,
  Flag,
  ListTodo,
  ShieldCheck,
  Zap,
  FileSearch,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWorkflow } from '@/store/workflowStore';
import { simulateWorkflow } from '@/lib/api';
import type { NodeKind, SimulationStep, ValidationError } from '@/types/workflow';

interface Props {
  open: boolean;
  onClose: () => void;
}

const NODE_ICON: Record<NodeKind, LucideIcon> = {
  start: Flag,
  task: ListTodo,
  approval: ShieldCheck,
  automated: Zap,
  ats: FileSearch,
  end: Flag,
};

export function SimulatorPanel({ open, onClose }: Props) {
  const {
    nodes,
    edges,
    simulation,
    setSimulation,
    isSimulating,
    setSimulating,
    validate,
    candidate,
  } = useWorkflow();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  if (!open) return null;

  const runSimulation = async () => {
    const errors = validate();
    setValidationErrors(errors);
    const blockers = errors.filter((e) => e.type === 'error');
    if (blockers.length) {
      setSimulation(null);
      return;
    }
    setSimulating(true);
    try {
      const result = await simulateWorkflow({ nodes, edges });
      setSimulation(result);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex w-[440px] flex-col border-l border-ink-200 bg-white shadow-panel animate-slide-in"
    >
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent">
            Sandbox
          </div>
          <h2 className="mt-0.5 font-display text-[20px] font-semibold tracking-tight text-ink-900">
            Workflow Simulator
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
        {/* Candidate banner */}
        {candidate && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50/40 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white font-semibold text-[13px]">
              {candidate.fullName
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-ink-900">
                {candidate.fullName}
              </div>
              <div className="truncate text-[11px] font-mono text-ink-500">
                {candidate.email}
              </div>
            </div>
            <div className="rounded bg-white px-2 py-1 text-[11px] font-mono">
              ATS <span className="font-bold text-accent">{candidate.atsScore ?? 0}</span>
            </div>
          </div>
        )}

        {/* Run button */}
        <Button
          variant="accent"
          icon={
            isSimulating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Play size={13} />
            )
          }
          onClick={runSimulation}
          disabled={isSimulating}
          className="w-full"
        >
          {isSimulating ? 'Simulating…' : 'Run simulation'}
        </Button>

        {/* Validation */}
        {validationErrors.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
              Validation
            </h3>
            <div className="space-y-1">
              {validationErrors.map((err, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[12px] ${
                    err.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <AlertTriangle size={13} className="mt-[2px] shrink-0" />
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {simulation && (
          <div className="mt-5">
            <ResultSummary simulation={simulation} />

            <h3 className="mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
              Execution log
            </h3>
            <ol className="relative space-y-2.5 border-l-2 border-ink-100 pl-5">
              {simulation.steps.map((step, i) => (
                <StepItem key={`${step.nodeId}-${i}`} step={step} index={i} />
              ))}
            </ol>

            {simulation.terminationReason && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-800">
                <Ban size={14} className="mt-[2px] shrink-0" />
                <div>
                  <div className="font-semibold">Workflow terminated</div>
                  <div className="mt-0.5">{simulation.terminationReason}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {!simulation && validationErrors.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-ink-200 p-4 text-[12.5px] leading-relaxed text-ink-500">
            <p className="mb-1.5 font-semibold text-ink-700">How it works</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Validates graph structure (cycles, disconnected nodes).</li>
              <li>Walks from Start, following each node's decision.</li>
              <li>
                <span className="font-semibold text-approve">Present</span>{' '}
                advances to the next stage.
              </li>
              <li>
                <span className="font-semibold text-reject">Absent</span>{' '}
                routes to the rejection branch or terminates.
              </li>
              <li>
                <span className="text-ink-500">No decision</span> pauses the
                simulation mid-flow.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ResultSummary({
  simulation,
}: {
  simulation: import('@/types/workflow').SimulationResult;
}) {
  const tone =
    simulation.finalOutcome === 'hired'
      ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle2 size={16} /> }
      : simulation.finalOutcome === 'rejected'
      ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <XCircle size={16} /> }
      : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <Clock size={16} /> };

  return (
    <div className={`rounded-lg border p-3 ${tone.border} ${tone.bg} ${tone.text}`}>
      <div className="flex items-center gap-2">
        {tone.icon}
        <div className="flex-1">
          <div className="text-[13px] font-semibold">
            Outcome: {(simulation.finalOutcome ?? 'incomplete').toUpperCase()}
          </div>
          <div className="text-[11.5px] opacity-80">
            {simulation.steps.length} steps · {simulation.durationMs}ms
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ step, index }: { step: SimulationStep; index: number }) {
  const Icon = NODE_ICON[step.nodeKind];

  const statusMeta = {
    executed:
      step.decision === 'absent'
        ? { dot: 'bg-red-500', pill: 'bg-red-100 text-red-700' }
        : { dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700' },
    terminated: { dot: 'bg-red-600', pill: 'bg-red-100 text-red-800' },
    waiting: { dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-700' },
    skipped: { dot: 'bg-ink-300', pill: 'bg-ink-100 text-ink-600' },
  }[step.status];

  return (
    <li className="relative">
      <span
        className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${statusMeta.dot}`}
      />
      <div className="rounded-md border border-ink-100 bg-white p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-ink-400">
              #{String(index + 1).padStart(2, '0')}
            </span>
            <Icon size={12} />
            <span className="text-[13px] font-semibold text-ink-900">
              {step.nodeTitle}
            </span>
          </div>
          <span
            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase ${statusMeta.pill}`}
          >
            {step.status === 'terminated' && <Ban size={9} />}
            {step.status === 'waiting' && <Clock size={9} />}
            {step.status === 'executed' && step.decision === 'present' && (
              <CheckCircle2 size={9} strokeWidth={3} />
            )}
            {step.status === 'executed' && step.decision === 'absent' && (
              <XCircle size={9} strokeWidth={3} />
            )}
            {step.status === 'executed' && !step.decision && (
              <ArrowRight size={9} strokeWidth={3} />
            )}
            {step.status}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-snug text-ink-600">
          {step.message}
        </p>
      </div>
    </li>
  );
}
