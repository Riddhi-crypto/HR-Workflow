/**
 * Workflow store.
 *
 * Central state for nodes, edges, selection, candidate, simulation.
 * All mutations go through explicit actions — we never leak `setState`
 * to components.
 *
 * The key invariant: whenever a node's `decision` changes, the store
 * auto-reconnects outgoing edges so the graph matches what would execute.
 * Consumers never wire connections by hand for present/absent — they just
 * flip the chip on the node.
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  NodeKind,
  Decision,
  CandidateInfo,
  SimulationResult,
  ValidationError,
} from '@/types/workflow';
import { nodeFactoryFor } from '@/lib/nodeFactory';
import { autoRelinkOutgoing } from '@/lib/graphOps';

interface WorkflowStore {
  /* Graph state */
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;

  /* Candidate & simulation */
  candidate: CandidateInfo | null;
  simulation: SimulationResult | null;
  isSimulating: boolean;

  /* Graph actions */
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;

  addNode: (kind: NodeKind, position: { x: number; y: number }) => string;
  updateNodeData: (id: string, patch: Partial<WorkflowNodeData>) => void;
  setDecision: (id: string, decision: Decision) => void;
  deleteNode: (id: string) => void;

  connect: (
    source: string,
    target: string,
    branch?: 'present' | 'absent' | 'default',
    sourceHandle?: string | null,
  ) => void;

  selectNode: (id: string | null) => void;

  /* Candidate */
  setCandidate: (c: CandidateInfo | null) => void;

  /* Simulation */
  setSimulation: (r: SimulationResult | null) => void;
  setSimulating: (v: boolean) => void;

  /* Validation */
  validate: () => ValidationError[];

  /* Bulk ops */
  loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  resetWorkflow: () => void;
  exportJSON: () => string;
}

/* -------------------------------------------------------------------------- */
/*  Seed graph                                                                */
/* -------------------------------------------------------------------------- */

function buildSeedGraph(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const make = (kind: NodeKind, x: number, y: number): WorkflowNode => ({
    id: nanoid(8),
    type: kind,
    position: { x, y },
    data: nodeFactoryFor(kind),
  });

  const start = make('start', 80, 260);
  const ats = make('ats', 360, 260);
  const task = make('task', 640, 260);
  const approval = make('approval', 920, 260);
  const automated = make('automated', 1200, 140);
  const endHired = make('end', 1480, 140);
  (endHired.data as any).endMessage = 'Welcome aboard!';
  (endHired.data as any).outcome = 'hired';
  (endHired.data as any).title = 'Hired';

  const endRejected = make('end', 1200, 420);
  (endRejected.data as any).endMessage = 'Thank you for applying.';
  (endRejected.data as any).outcome = 'rejected';
  (endRejected.data as any).title = 'Rejected';

  const edge = (
    source: string,
    target: string,
    branch: 'present' | 'absent' | 'default',
    sourceHandle: string | null = null,
  ): WorkflowEdge => ({
    id: `e-${source}-${target}-${branch}`,
    source,
    target,
    sourceHandle: sourceHandle ?? undefined,
    type: 'smoothstep',
    animated: branch === 'present',
    className: `edge-${branch}`,
    data: { branch },
  });

  const nodes = [start, ats, task, approval, automated, endHired, endRejected];
  const edges: WorkflowEdge[] = [
    edge(start.id, ats.id, 'default'),
    edge(ats.id, task.id, 'present', 'present'),
    edge(ats.id, endRejected.id, 'absent', 'absent'),
    edge(task.id, approval.id, 'present', 'present'),
    edge(task.id, endRejected.id, 'absent', 'absent'),
    edge(approval.id, automated.id, 'present', 'present'),
    edge(approval.id, endRejected.id, 'absent', 'absent'),
    edge(automated.id, endHired.id, 'present', 'present'),
    edge(automated.id, endRejected.id, 'absent', 'absent'),
  ];

  return { nodes, edges };
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

const seed = buildSeedGraph();

export const useWorkflow = create<WorkflowStore>((set, get) => ({
  nodes: seed.nodes,
  edges: seed.edges,
  selectedNodeId: null,
  candidate: null,
  simulation: null,
  isSimulating: false,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[] });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) as WorkflowEdge[] });
  },

  addNode: (kind, position) => {
    const id = nanoid(8);
    const node: WorkflowNode = {
      id,
      type: kind,
      position,
      data: nodeFactoryFor(kind),
    };
    set({ nodes: [...get().nodes, node], selectedNodeId: id });
    return id;
  },

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, ...patch } as WorkflowNodeData }
          : n,
      ),
    });
  },

  setDecision: (id, decision) => {
    const state = get();
    const updated = state.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, decision } } : n,
    );
    // Auto-relink outgoing edges so present/absent routing matches the
    // new decision. This is the "no manual connection" contract.
    const relinked = autoRelinkOutgoing(updated, state.edges, id, decision);
    set({ nodes: updated, edges: relinked });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId:
        get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  connect: (source, target, branch = 'default', sourceHandle = null) => {
    const id = `e-${source}-${target}-${branch}-${nanoid(4)}`;
    const newEdge: WorkflowEdge = {
      id,
      source,
      target,
      sourceHandle: sourceHandle ?? undefined,
      type: 'smoothstep',
      animated: branch === 'present',
      className: `edge-${branch}`,
      data: { branch },
    };
    // Prevent duplicate edges for the same (source, target, branch) triple
    const exists = get().edges.some(
      (e) =>
        e.source === source &&
        e.target === target &&
        e.data?.branch === branch,
    );
    if (exists) return;
    set({ edges: [...get().edges, newEdge] });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setCandidate: (candidate) => set({ candidate }),
  setSimulation: (simulation) => set({ simulation }),
  setSimulating: (isSimulating) => set({ isSimulating }),

  validate: () => {
    const { nodes, edges } = get();
    const errors: ValidationError[] = [];

    const starts = nodes.filter((n) => n.data.kind === 'start');
    if (starts.length === 0) {
      errors.push({ type: 'error', message: 'Workflow needs a Start node.' });
    } else if (starts.length > 1) {
      errors.push({
        type: 'error',
        message: `Only one Start node allowed (found ${starts.length}).`,
      });
    }

    if (!nodes.some((n) => n.data.kind === 'end')) {
      errors.push({
        type: 'warning',
        message: 'No End node — workflow has no defined terminal state.',
      });
    }

    // Every non-end, non-start node must have at least one outgoing edge
    nodes.forEach((n) => {
      if (n.data.kind === 'end') return;
      const outs = edges.filter((e) => e.source === n.id);
      if (outs.length === 0) {
        errors.push({
          type: 'error',
          nodeId: n.id,
          message: `"${n.data.title}" has no outgoing connection.`,
        });
      }
    });

    // Cycle detection
    if (hasCycle(nodes, edges)) {
      errors.push({
        type: 'error',
        message: 'Cycle detected — HR workflows must be acyclic.',
      });
    }

    return errors;
  },

  loadWorkflow: (nodes, edges) => set({ nodes, edges, selectedNodeId: null }),

  resetWorkflow: () => {
    const fresh = buildSeedGraph();
    set({
      nodes: fresh.nodes,
      edges: fresh.edges,
      selectedNodeId: null,
      simulation: null,
    });
  },

  exportJSON: () => {
    const { nodes, edges, candidate } = get();
    return JSON.stringify({ nodes, edges, candidate }, null, 2);
  },
}));

/* -------------------------------------------------------------------------- */
/*  Cycle detection                                                           */
/* -------------------------------------------------------------------------- */

function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const color = new Map<string, 0 | 1 | 2>();
  nodes.forEach((n) => color.set(n.id, 0));

  const dfs = (u: string): boolean => {
    color.set(u, 1);
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v);
      if (c === 1) return true;
      if (c === 0 && dfs(v)) return true;
    }
    color.set(u, 2);
    return false;
  };

  for (const n of nodes) {
    if (color.get(n.id) === 0 && dfs(n.id)) return true;
  }
  return false;
}
