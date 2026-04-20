/**
 * Shared shell for all custom nodes.
 *
 * Renders a clean card with:
 *  - header (icon + kind label)
 *  - title
 *  - body (kind-specific children)
 *  - footer with decision chip + Present/Absent toggle
 *
 * Handles: single target (left), plus conditional "present" and "absent"
 * source handles on the right.
 */

import { Handle, Position } from '@xyflow/react';
import { Check, X, CircleDot } from 'lucide-react';
import clsx from 'clsx';
import type { Decision, NodeKind } from '@/types/workflow';
import { useWorkflow } from '@/store/workflowStore';

interface Props {
  id: string;
  kind: NodeKind;
  icon: React.ReactNode;
  accentHex: string;
  stageLabel?: string;
  title: string;
  selected?: boolean;
  decision: Decision;
  children?: React.ReactNode;
  /** Whether this node branches on present/absent or has a single exit */
  branching?: boolean;
  /** Hides the target handle (Start node) */
  noInput?: boolean;
  /** Hides the source handle (End node) */
  noOutput?: boolean;
}

export function NodeShell({
  id,
  kind,
  icon,
  accentHex,
  stageLabel,
  title,
  selected,
  decision,
  children,
  branching = true,
  noInput = false,
  noOutput = false,
}: Props) {
  const setDecision = useWorkflow((s) => s.setDecision);

  const showDecisionToggle = kind !== 'start' && kind !== 'end';

  return (
    <div
      className={clsx(
        'group relative w-[256px] rounded-xl border bg-white text-left shadow-node transition-all',
        selected ? 'border-accent shadow-node-active' : 'border-ink-200',
      )}
    >
      {/* Accent bar */}
      <div
        className="h-1 rounded-t-xl"
        style={{ background: accentHex }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-2.5">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: `${accentHex}22`, color: accentHex }}
        >
          {icon}
        </div>
        <div className="flex-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">
          {stageLabel ?? kind}
        </div>
        <DecisionBadge decision={decision} />
      </div>

      {/* Title */}
      <div className="px-3.5 pb-2 pt-1 text-[15px] font-semibold leading-tight text-ink-900">
        {title || <span className="text-ink-400">Untitled</span>}
      </div>

      {/* Kind-specific body */}
      {children && (
        <div className="mx-3.5 mb-2.5 border-t border-ink-100 pt-2 text-[12.5px] text-ink-600">
          {children}
        </div>
      )}

      {/* Decision controls */}
      {showDecisionToggle && (
        <div className="flex items-center gap-1 border-t border-ink-100 px-3 py-2">
          <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
            Mark
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDecision(id, decision === 'present' ? null : 'present');
            }}
            className={clsx(
              'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition',
              decision === 'present'
                ? 'border-approve bg-[var(--color-approve-soft)] text-approve'
                : 'border-ink-200 bg-white text-ink-600 hover:border-approve hover:text-approve',
            )}
          >
            <Check size={11} strokeWidth={3} />
            Present
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDecision(id, decision === 'absent' ? null : 'absent');
            }}
            className={clsx(
              'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition',
              decision === 'absent'
                ? 'border-reject bg-[var(--color-reject-soft)] text-reject'
                : 'border-ink-200 bg-white text-ink-600 hover:border-reject hover:text-reject',
            )}
          >
            <X size={11} strokeWidth={3} />
            Absent
          </button>
        </div>
      )}

      {/* Handles */}
      {!noInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!left-[-6px]"
        />
      )}

      {!noOutput && branching && (
        <>
          <Handle
            id="present"
            type="source"
            position={Position.Right}
            className="react-flow__handle-present !top-[38%] !right-[-6px]"
            style={{ background: 'var(--color-approve)' }}
          />
          <Handle
            id="absent"
            type="source"
            position={Position.Right}
            className="react-flow__handle-absent !top-[62%] !right-[-6px]"
            style={{ background: 'var(--color-reject)' }}
          />
        </>
      )}
      {!noOutput && !branching && (
        <Handle
          type="source"
          position={Position.Right}
          className="!right-[-6px]"
        />
      )}
    </div>
  );
}

function DecisionBadge({ decision }: { decision: Decision }) {
  if (decision === 'present')
    return (
      <span className="chip chip-present">
        <Check size={10} strokeWidth={3} /> Present
      </span>
    );
  if (decision === 'absent')
    return (
      <span className="chip chip-absent">
        <X size={10} strokeWidth={3} /> Absent
      </span>
    );
  return (
    <span className="chip chip-pending">
      <CircleDot size={9} /> Pending
    </span>
  );
}
