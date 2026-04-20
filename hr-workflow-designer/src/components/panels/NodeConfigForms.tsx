/**
 * Per-kind configuration forms.
 *
 * A single <NodeConfigForm /> dispatches on `data.kind`. Adding a new node
 * type means: extend the union in `types/workflow.ts`, add a default in
 * `nodeFactory.ts`, render a card in `nodes/index.tsx`, and add a form
 * below. Four edits — that's the extension surface.
 */

import { useEffect, useState } from 'react';
import {
  Field,
  TextInput,
  TextArea,
  NumberInput,
  Select,
  Toggle,
  KeyValueList,
  ChipEditor,
} from '@/components/ui/FormPrimitives';
import { useWorkflow } from '@/store/workflowStore';
import type {
  AutomationAction,
  StartNodeData,
  TaskNodeData,
  ApprovalNodeData,
  AutomatedNodeData,
  ATSNodeData,
  EndNodeData,
  WorkflowNodeData,
} from '@/types/workflow';
import { fetchAutomations } from '@/lib/api';

interface Props<T extends WorkflowNodeData> {
  id: string;
  data: T;
}

/* -------------------------------- START ----------------------------------- */
export function StartForm({ id, data }: Props<StartNodeData>) {
  const update = useWorkflow((s) => s.updateNodeData);
  return (
    <div className="space-y-3">
      <Field label="Start title" required>
        <TextInput
          value={data.title}
          onChange={(e) => update(id, { title: e.target.value })}
        />
      </Field>
      <Toggle
        value={data.requireResume}
        onChange={(v) => update(id, { requireResume: v })}
        label="Require resume upload on entry"
      />
      <Field label="Metadata" hint="Arbitrary key-value tags attached to every run.">
        <KeyValueList
          items={data.metadata}
          onChange={(metadata) => update(id, { metadata })}
        />
      </Field>
    </div>
  );
}

/* -------------------------------- TASK ------------------------------------ */
export function TaskForm({ id, data }: Props<TaskNodeData>) {
  const update = useWorkflow((s) => s.updateNodeData);
  return (
    <div className="space-y-3">
      <Field label="Task title" required>
        <TextInput
          value={data.title}
          onChange={(e) => update(id, { title: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <TextArea
          value={data.description}
          onChange={(e) => update(id, { description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Assignee">
          <TextInput
            value={data.assignee}
            placeholder="e.g. HR Operations"
            onChange={(e) => update(id, { assignee: e.target.value })}
          />
        </Field>
        <Field label="Due date">
          <TextInput
            type="date"
            value={data.dueDate}
            onChange={(e) => update(id, { dueDate: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Custom fields">
        <KeyValueList
          items={data.customFields}
          onChange={(customFields) => update(id, { customFields })}
        />
      </Field>
    </div>
  );
}

/* -------------------------------- APPROVAL -------------------------------- */
export function ApprovalForm({ id, data }: Props<ApprovalNodeData>) {
  const update = useWorkflow((s) => s.updateNodeData);
  return (
    <div className="space-y-3">
      <Field label="Approval title" required>
        <TextInput
          value={data.title}
          onChange={(e) => update(id, { title: e.target.value })}
        />
      </Field>
      <Field label="Approver role" required>
        <Select
          value={data.approverRole}
          onChange={(v) => update(id, { approverRole: v })}
        >
          <option value="Hiring Manager">Hiring Manager</option>
          <option value="HRBP">HR Business Partner</option>
          <option value="Director">Director</option>
          <option value="CTO">CTO</option>
          <option value="Panel">Interview Panel</option>
        </Select>
      </Field>
      <Field
        label="Auto-approve threshold"
        hint="Score above which candidates auto-pass this gate."
      >
        <NumberInput
          value={data.autoApproveThreshold}
          min={0}
          max={100}
          onChange={(e) =>
            update(id, { autoApproveThreshold: Number(e.target.value) })
          }
        />
      </Field>
    </div>
  );
}

/* -------------------------------- AUTOMATED ------------------------------- */
export function AutomatedForm({ id, data }: Props<AutomatedNodeData>) {
  const update = useWorkflow((s) => s.updateNodeData);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetchAutomations().then((a) => {
      if (!live) return;
      setActions(a);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const current = actions.find((a) => a.id === data.actionId);

  const onActionChange = (newId: string) => {
    const action = actions.find((a) => a.id === newId);
    if (!action) return;
    // Reset params to the new action's shape so the dynamic form is honest.
    const actionParams = Object.fromEntries(action.params.map((p) => [p, '']));
    update(id, {
      actionId: newId,
      actionLabel: action.label,
      actionParams,
    });
  };

  return (
    <div className="space-y-3">
      <Field label="Step title" required>
        <TextInput
          value={data.title}
          onChange={(e) => update(id, { title: e.target.value })}
        />
      </Field>

      <Field
        label="Action"
        required
        hint={loading ? 'Loading actions…' : current?.description}
      >
        <Select value={data.actionId} onChange={onActionChange}>
          {actions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      </Field>

      {/* Dynamic params driven by the selected action's `params` list */}
      {current && current.params.length > 0 && (
        <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-2.5">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
            Action parameters
          </div>
          <div className="space-y-2">
            {current.params.map((param) => (
              <Field key={param} label={param}>
                <TextInput
                  value={data.actionParams[param] ?? ''}
                  onChange={(e) =>
                    update(id, {
                      actionParams: {
                        ...data.actionParams,
                        [param]: e.target.value,
                      },
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- ATS ------------------------------------- */
export function ATSForm({ id, data }: Props<ATSNodeData>) {
  const update = useWorkflow((s) => s.updateNodeData);
  return (
    <div className="space-y-3">
      <Field label="Screen title" required>
        <TextInput
          value={data.title}
          onChange={(e) => update(id, { title: e.target.value })}
        />
      </Field>
      <Field label="Minimum score" hint="Candidates below this score are marked Absent.">
        <NumberInput
          min={0}
          max={100}
          value={data.minScore}
          onChange={(e) => update(id, { minScore: Number(e.target.value) })}
        />
      </Field>
      <Field
        label="Required keywords"
        hint="Press Enter or comma to add. Used by the resume scorer."
      >
        <ChipEditor
          items={data.requiredKeywords}
          onChange={(requiredKeywords) => update(id, { requiredKeywords })}
          placeholder="e.g. React"
        />
      </Field>
    </div>
  );
}

/* -------------------------------- END ------------------------------------- */
export function EndForm({ id, data }: Props<EndNodeData>) {
  const update = useWorkflow((s) => s.updateNodeData);
  return (
    <div className="space-y-3">
      <Field label="Node title" required>
        <TextInput
          value={data.title}
          onChange={(e) => update(id, { title: e.target.value })}
        />
      </Field>
      <Field label="Outcome">
        <Select
          value={data.outcome}
          onChange={(v) =>
            update(id, { outcome: v as EndNodeData['outcome'] })
          }
        >
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </Select>
      </Field>
      <Field label="End message">
        <TextArea
          value={data.endMessage}
          onChange={(e) => update(id, { endMessage: e.target.value })}
        />
      </Field>
      <Toggle
        value={data.summaryFlag}
        onChange={(v) => update(id, { summaryFlag: v })}
        label="Generate summary report"
      />
    </div>
  );
}

/* -------------------------------- DISPATCHER ------------------------------ */
export function NodeConfigForm({
  id,
  data,
}: {
  id: string;
  data: WorkflowNodeData;
}) {
  switch (data.kind) {
    case 'start':
      return <StartForm id={id} data={data} />;
    case 'task':
      return <TaskForm id={id} data={data} />;
    case 'approval':
      return <ApprovalForm id={id} data={data} />;
    case 'automated':
      return <AutomatedForm id={id} data={data} />;
    case 'ats':
      return <ATSForm id={id} data={data} />;
    case 'end':
      return <EndForm id={id} data={data} />;
  }
}
