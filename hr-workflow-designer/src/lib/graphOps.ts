/**
 * Graph operations.
 *
 * `autoRelinkOutgoing` is the core of the auto-flow contract: whenever
 * an HR admin flips a node's decision between "present" and "absent",
 * we do NOT destroy the graph. Instead, we annotate and style the edges
 * so the active branch is highlighted and the simulation engine
 * follows the correct path.
 *
 * Kept intentionally simple and pure — easy to unit-test.
 */

import type { WorkflowEdge, WorkflowNode, Decision } from '@/types/workflow';

export function autoRelinkOutgoing(
  _nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  sourceId: string,
  decision: Decision,
): WorkflowEdge[] {
  return edges.map((e) => {
    if (e.source !== sourceId) return e;
    const branch = e.data?.branch ?? 'default';

    // Edges on the inactive branch get dimmed; the active branch is animated.
    const isActive =
      decision === null
        ? branch === 'default' // no decision yet → default edges look primary
        : (decision === 'present' && (branch === 'present' || branch === 'default')) ||
          (decision === 'absent' && branch === 'absent');

    return {
      ...e,
      animated: isActive && branch !== 'default',
      className:
        `edge-${branch}` + (isActive ? '' : ' opacity-30'),
    };
  });
}
