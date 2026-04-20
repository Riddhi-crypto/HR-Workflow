/**
 * Mock API client.
 *
 * In production this layer would be replaced with a fetch-based client
 * hitting `/automations` and `/simulate`. The surface is identical so
 * swapping it out is a one-line change in `lib/http.ts`.
 */

import type {
  AutomationAction,
  SimulationResult,
  SimulationStep,
  WorkflowNode,
  WorkflowEdge,
  Decision,
  NodeKind,
} from '@/types/workflow';
import { MOCK_AUTOMATIONS } from '@/mocks/automations';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/*  GET /automations                                                          */
/* -------------------------------------------------------------------------- */

export async function fetchAutomations(): Promise<AutomationAction[]> {
  await sleep(180);
  return MOCK_AUTOMATIONS;
}

/* -------------------------------------------------------------------------- */
/*  POST /simulate                                                            */
/* -------------------------------------------------------------------------- */

interface SimulatePayload {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Walks the workflow graph starting at the Start node, following edges
 * according to each node's `decision` field.
 *
 * Rules:
 *  - "present" or "tick" → follow the green/present edge (or the only edge
 *    if no branching exists).
 *  - "absent" → follow the red/absent edge if one exists, OR terminate
 *    the workflow (the desired default behaviour).
 *  - null (no decision) → mark step as waiting and halt (still a valid
 *    partial simulation).
 */
export async function simulateWorkflow(
  payload: SimulatePayload,
): Promise<SimulationResult> {
  await sleep(400);

  const { nodes, edges } = payload;
  const startedAt = Date.now();

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outgoingByNode = new Map<string, WorkflowEdge[]>();
  edges.forEach((e) => {
    const list = outgoingByNode.get(e.source) ?? [];
    list.push(e);
    outgoingByNode.set(e.source, list);
  });

  const steps: SimulationStep[] = [];
  const visited = new Set<string>();

  // Find start node
  const start = nodes.find((n) => n.data.kind === 'start');
  if (!start) {
    return {
      success: false,
      steps: [],
      terminationReason: 'No Start node found in workflow.',
      durationMs: Date.now() - startedAt,
    };
  }

  let current: WorkflowNode | undefined = start;
  let terminated = false;
  let terminationReason: string | undefined;
  let finalOutcome: SimulationResult['finalOutcome'] = 'incomplete';

  while (current && !terminated) {
    if (visited.has(current.id)) {
      terminated = true;
      terminationReason = `Cycle detected at "${current.data.title}".`;
      break;
    }
    visited.add(current.id);

    const decision: Decision = current.data.decision;
    const kind: NodeKind = current.data.kind;
    const message = buildStepMessage(current);

    // Start and End nodes don't need decisions to advance — but every other
    // node enforces the present/absent contract.
    const needsDecision = kind !== 'start' && kind !== 'end';
    const outgoing = outgoingByNode.get(current.id) ?? [];

    if (needsDecision && decision === null) {
      steps.push({
        nodeId: current.id,
        nodeTitle: current.data.title,
        nodeKind: kind,
        decision,
        status: 'waiting',
        message: `Waiting for HR to mark "${current.data.title}" as Present or Absent.`,
        timestamp: Date.now(),
      });
      terminated = true;
      terminationReason = `No decision recorded for "${current.data.title}".`;
      break;
    }

    if (needsDecision && decision === 'absent') {
      // Look for an explicit "absent" edge — if not found, terminate.
      const absentEdge = outgoing.find((e) => e.data?.branch === 'absent');
      steps.push({
        nodeId: current.id,
        nodeTitle: current.data.title,
        nodeKind: kind,
        decision,
        status: absentEdge ? 'executed' : 'terminated',
        message: absentEdge
          ? `${message} → candidate marked ABSENT, routing to rejection branch.`
          : `${message} → candidate marked ABSENT, workflow terminated.`,
        timestamp: Date.now(),
      });

      if (!absentEdge) {
        terminated = true;
        terminationReason = `Candidate marked ABSENT at "${current.data.title}" — no rejection branch wired, flow ended.`;
        finalOutcome = 'rejected';
        break;
      }
      current = nodeMap.get(absentEdge.target);
      continue;
    }

    // Executed (either present, or a terminal node)
    steps.push({
      nodeId: current.id,
      nodeTitle: current.data.title,
      nodeKind: kind,
      decision,
      status: 'executed',
      message,
      timestamp: Date.now(),
    });

    if (kind === 'end') {
      const endData = current.data as typeof current.data & {
        outcome: 'hired' | 'rejected' | 'withdrawn';
      };
      finalOutcome =
        endData.outcome === 'hired'
          ? 'hired'
          : endData.outcome === 'rejected'
          ? 'rejected'
          : 'incomplete';
      break;
    }

    // Pick the outgoing edge: prefer the present branch, else the default/only.
    const presentEdge = outgoing.find((e) => e.data?.branch === 'present');
    const defaultEdge = outgoing.find((e) => e.data?.branch === 'default');
    const nextEdge = presentEdge ?? defaultEdge ?? outgoing[0];

    if (!nextEdge) {
      terminated = true;
      terminationReason = `Dead end — "${current.data.title}" has no outgoing connection.`;
      break;
    }
    current = nodeMap.get(nextEdge.target);
  }

  return {
    success: !terminationReason,
    steps,
    terminationReason,
    terminatedAt: terminationReason ? new Date().toISOString() : undefined,
    completedAt: !terminationReason ? new Date().toISOString() : undefined,
    finalOutcome,
    durationMs: Date.now() - startedAt,
  };
}

function buildStepMessage(node: WorkflowNode): string {
  const d = node.data;
  switch (d.kind) {
    case 'start':
      return `Workflow entered at "${d.title}"${
        d.requireResume ? ' — resume intake required.' : '.'
      }`;
    case 'task':
      return `Task "${d.title}" assigned to ${d.assignee || 'unassigned'}${
        d.dueDate ? `, due ${d.dueDate}` : ''
      }.`;
    case 'approval':
      return `Approval requested from ${d.approverRole || 'reviewer'} (auto-approve ≥ ${
        d.autoApproveThreshold
      }).`;
    case 'automated':
      return `Automated action: ${d.actionLabel || d.actionId} dispatched.`;
    case 'ats':
      return `ATS screen — min score ${d.minScore}, keywords: ${
        d.requiredKeywords.join(', ') || '—'
      }.`;
    case 'end':
      return `Workflow completed — outcome: ${d.outcome.toUpperCase()}.`;
  }
}
