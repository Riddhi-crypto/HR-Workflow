/**
 * Concrete node renderers — one per NodeKind.
 * Each is a thin wrapper around <NodeShell />.
 */

import type { NodeProps } from '@xyflow/react';
import {
  Flag,
  ListTodo,
  ShieldCheck,
  Zap,
  FileSearch,
  Flag as FlagEnd,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { NodeShell } from './NodeShell';
import type {
  StartNodeData,
  TaskNodeData,
  ApprovalNodeData,
  AutomatedNodeData,
  ATSNodeData,
  EndNodeData,
} from '@/types/workflow';

/* ----------------------------- START -------------------------------------- */
export function StartNode({ id, data, selected }: NodeProps) {
  const d = data as StartNodeData;
  return (
    <NodeShell
      id={id}
      kind="start"
      icon={<Flag size={13} strokeWidth={2.5} />}
      accentHex="#0891b2"
      stageLabel={d.stageLabel}
      title={d.title}
      selected={selected}
      decision={d.decision}
      noInput
      branching={false}
    >
      <div className="flex items-center justify-between">
        <span className="text-ink-500">Resume intake</span>
        <span
          className={
            d.requireResume
              ? 'font-semibold text-accent'
              : 'text-ink-400'
          }
        >
          {d.requireResume ? 'Required' : 'Optional'}
        </span>
      </div>
      {d.metadata.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {d.metadata.slice(0, 2).map((m, i) => (
            <div key={i} className="flex gap-1.5 text-[11px] text-ink-500">
              <span className="font-mono text-ink-400">{m.key}:</span>
              <span className="truncate">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </NodeShell>
  );
}

/* ----------------------------- TASK --------------------------------------- */
export function TaskNode({ id, data, selected }: NodeProps) {
  const d = data as TaskNodeData;
  return (
    <NodeShell
      id={id}
      kind="task"
      icon={<ListTodo size={13} strokeWidth={2.5} />}
      accentHex="#2563eb"
      stageLabel={d.stageLabel}
      title={d.title}
      selected={selected}
      decision={d.decision}
    >
      <div className="space-y-1">
        {d.description && (
          <p className="line-clamp-2 text-[11.5px] text-ink-500">
            {d.description}
          </p>
        )}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-ink-500">
            {d.assignee || 'Unassigned'}
          </span>
          {d.dueDate && (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-ink-700">
              {d.dueDate}
            </span>
          )}
        </div>
      </div>
    </NodeShell>
  );
}

/* ----------------------------- APPROVAL ----------------------------------- */
export function ApprovalNode({ id, data, selected }: NodeProps) {
  const d = data as ApprovalNodeData;
  return (
    <NodeShell
      id={id}
      kind="approval"
      icon={<ShieldCheck size={13} strokeWidth={2.5} />}
      accentHex="#9333ea"
      stageLabel={d.stageLabel}
      title={d.title}
      selected={selected}
      decision={d.decision}
    >
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{d.approverRole}</span>
        <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-700">
          auto ≥ {d.autoApproveThreshold}
        </span>
      </div>
    </NodeShell>
  );
}

/* ----------------------------- AUTOMATED ---------------------------------- */
export function AutomatedNode({ id, data, selected }: NodeProps) {
  const d = data as AutomatedNodeData;
  return (
    <NodeShell
      id={id}
      kind="automated"
      icon={<Zap size={13} strokeWidth={2.5} />}
      accentHex="#ea580c"
      stageLabel={d.stageLabel}
      title={d.title}
      selected={selected}
      decision={d.decision}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11.5px]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-medium text-ink-700">
            {d.actionLabel || d.actionId}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(d.actionParams)
            .slice(0, 3)
            .map(([k, v]) => (
              <span
                key={k}
                className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-600"
              >
                {k}={v || '—'}
              </span>
            ))}
        </div>
      </div>
    </NodeShell>
  );
}

/* ----------------------------- ATS ---------------------------------------- */
export function ATSNode({ id, data, selected }: NodeProps) {
  const d = data as ATSNodeData;
  return (
    <NodeShell
      id={id}
      kind="ats"
      icon={<FileSearch size={13} strokeWidth={2.5} />}
      accentHex="#059669"
      stageLabel={d.stageLabel}
      title={d.title}
      selected={selected}
      decision={d.decision}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-ink-500">Min score</span>
          <span className="font-mono text-ink-800">{d.minScore}</span>
        </div>
        {d.requiredKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.requiredKeywords.slice(0, 4).map((k) => (
              <span
                key={k}
                className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700"
              >
                {k}
              </span>
            ))}
            {d.requiredKeywords.length > 4 && (
              <span className="text-[10.5px] text-ink-400">
                +{d.requiredKeywords.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </NodeShell>
  );
}

/* ----------------------------- END ---------------------------------------- */
export function EndNode({ id, data, selected }: NodeProps) {
  const d = data as EndNodeData;
  const Icon =
    d.outcome === 'hired'
      ? CheckCircle2
      : d.outcome === 'rejected'
      ? XCircle
      : FlagEnd;
  const color =
    d.outcome === 'hired'
      ? '#16a34a'
      : d.outcome === 'rejected'
      ? '#dc2626'
      : '#6b7280';

  return (
    <NodeShell
      id={id}
      kind="end"
      icon={<Icon size={13} strokeWidth={2.5} />}
      accentHex={color}
      stageLabel={d.stageLabel}
      title={d.title}
      selected={selected}
      decision={d.decision}
      noOutput
      branching={false}
    >
      <div className="flex items-center justify-between">
        <span className="text-ink-500 line-clamp-1">{d.endMessage}</span>
        <span
          className="ml-2 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ background: `${color}22`, color }}
        >
          {d.outcome}
        </span>
      </div>
    </NodeShell>
  );
}

export const NODE_TYPES = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  ats: ATSNode,
  end: EndNode,
};
