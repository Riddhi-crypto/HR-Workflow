/**
 * Right-side inspector. Shows either:
 *  - The config form for the selected node, OR
 *  - A friendly "nothing selected" state that promotes the ATS + simulator.
 */

import { Trash2, X, Check, CircleDot } from 'lucide-react';
import { useWorkflow } from '@/store/workflowStore';
import { NodeConfigForm } from './NodeConfigForms';
import { Button } from '@/components/ui/Button';

export function Inspector() {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    deleteNode,
    setDecision,
  } = useWorkflow();

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) return <EmptyState />;

  const data = node.data;
  const canDelete = data.kind !== 'start'; // guard: at least one start always

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-ink-200 bg-white">
      {/* Header */}
      <div className="border-b border-ink-200 px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              {data.stageLabel ?? data.kind}
            </div>
            <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-tight text-ink-900">
              Configure Stage
            </h2>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Decision quick-switch (duplicated for accessibility; same action as on-node) */}
      {data.kind !== 'start' && data.kind !== 'end' && (
        <div className="border-b border-ink-100 bg-ink-50/40 px-4 py-2.5">
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
            HR Decision
          </div>
          <div className="flex gap-1.5">
            <DecisionButton
              active={data.decision === 'present'}
              tone="present"
              onClick={() =>
                setDecision(
                  node.id,
                  data.decision === 'present' ? null : 'present',
                )
              }
              label="Present / Tick"
            />
            <DecisionButton
              active={data.decision === 'absent'}
              tone="absent"
              onClick={() =>
                setDecision(
                  node.id,
                  data.decision === 'absent' ? null : 'absent',
                )
              }
              label="Absent"
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
            {data.decision === 'present' &&
              'Candidate continues to the next stage.'}
            {data.decision === 'absent' &&
              'Workflow routes to rejection branch or terminates here.'}
            {data.decision === null &&
              'Awaiting verdict — simulation will pause at this stage.'}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="custom-scroll flex-1 overflow-y-auto px-4 py-3.5">
        <NodeConfigForm id={node.id} data={node.data} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-ink-200 bg-ink-50/40 px-4 py-2.5">
        <div className="text-[11px] font-mono text-ink-400">
          id: {node.id}
        </div>
        {canDelete && (
          <Button
            variant="danger"
            icon={<Trash2 size={13} />}
            onClick={() => deleteNode(node.id)}
          >
            Delete
          </Button>
        )}
      </div>
    </aside>
  );
}

function DecisionButton({
  active,
  tone,
  onClick,
  label,
}: {
  active: boolean;
  tone: 'present' | 'absent';
  onClick: () => void;
  label: string;
}) {
  const color = tone === 'present' ? 'approve' : 'reject';
  const Icon = tone === 'present' ? Check : X;
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[12px] font-semibold transition-all ${
        active
          ? tone === 'present'
            ? 'border-approve bg-[var(--color-approve-soft)] text-approve'
            : 'border-reject bg-[var(--color-reject-soft)] text-reject'
          : `border-ink-200 bg-white text-ink-600 hover:border-${color} hover:text-${color}`
      }`}
    >
      <Icon size={12} strokeWidth={3} />
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-ink-200 bg-white">
      <div className="border-b border-ink-200 px-4 py-3.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          Inspector
        </div>
        <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-tight text-ink-900">
          Nothing selected
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-100">
          <CircleDot size={18} className="text-ink-400" />
        </div>
        <p className="max-w-[240px] text-[13px] leading-relaxed text-ink-600">
          Click any node on the canvas to configure it — titles, assignees,
          thresholds, automated actions, or ATS keywords.
        </p>
      </div>
    </aside>
  );
}
