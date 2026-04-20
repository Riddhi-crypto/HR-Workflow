/**
 * Left sidebar: draggable palette of node types.
 *
 * Drag one onto the canvas to drop it at the cursor (wired in WorkflowCanvas).
 */

import {
  Flag,
  ListTodo,
  ShieldCheck,
  Zap,
  FileSearch,
  Flag as FlagEnd,
  GripVertical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeKind } from '@/types/workflow';

interface PaletteItem {
  kind: NodeKind;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

const ITEMS: PaletteItem[] = [
  {
    kind: 'start',
    label: 'Start',
    description: 'Workflow entry',
    icon: Flag,
    accent: '#0891b2',
  },
  {
    kind: 'ats',
    label: 'ATS Screen',
    description: 'Resume scoring',
    icon: FileSearch,
    accent: '#059669',
  },
  {
    kind: 'task',
    label: 'Task',
    description: 'Human action',
    icon: ListTodo,
    accent: '#2563eb',
  },
  {
    kind: 'approval',
    label: 'Approval',
    description: 'Reviewer gate',
    icon: ShieldCheck,
    accent: '#9333ea',
  },
  {
    kind: 'automated',
    label: 'Automated',
    description: 'System action',
    icon: Zap,
    accent: '#ea580c',
  },
  {
    kind: 'end',
    label: 'End',
    description: 'Terminal state',
    icon: FlagEnd,
    accent: '#6b7280',
  },
];

export function NodePalette() {
  const onDragStart = (e: React.DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData('application/x-workflow-node', kind);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="flex h-full w-[232px] flex-col border-r border-ink-200 bg-white">
      <div className="border-b border-ink-200 px-4 py-3.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          Build
        </div>
        <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-tight text-ink-900">
          Hiring Stages
        </h2>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto p-3">
        <p className="mb-2.5 px-1 text-[11.5px] leading-relaxed text-ink-500">
          Drag a stage onto the canvas. Flip{' '}
          <span className="font-semibold text-approve">Present</span> or{' '}
          <span className="font-semibold text-reject">Absent</span> on a
          node — connections route automatically.
        </p>

        <div className="space-y-1.5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.kind}
                draggable
                onDragStart={(e) => onDragStart(e, item.kind)}
                className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-ink-200 bg-white p-2.5 transition-all hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-sm active:cursor-grabbing"
              >
                <GripVertical
                  size={14}
                  className="text-ink-300 transition group-hover:text-ink-500"
                />
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{
                    background: `${item.accent}1a`,
                    color: item.accent,
                  }}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold leading-tight text-ink-900">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {item.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50/50 p-3">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
            Auto-flow rules
          </div>
          <ul className="space-y-1 text-[11.5px] leading-relaxed text-ink-600">
            <li className="flex gap-1.5">
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-approve" />
              <span>
                <strong>Present</strong> → continues along the green edge
              </span>
            </li>
            <li className="flex gap-1.5">
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-reject" />
              <span>
                <strong>Absent</strong> → routes to red edge or
                terminates
              </span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
