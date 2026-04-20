/**
 * Core type definitions for the HR Workflow Designer.
 *
 * Design note: Every node carries a `decision` field that represents the
 * HR admin's verdict at that stage ("present" | "absent" | null).
 * The runtime uses this to determine whether to proceed to the next stage
 * or terminate the workflow — no manual toggling of connections is required.
 */

import type { Node, Edge } from '@xyflow/react';

/* -------------------------------------------------------------------------- */
/*  Node kinds                                                                */
/* -------------------------------------------------------------------------- */

export type NodeKind =
  | 'start'
  | 'task'
  | 'approval'
  | 'automated'
  | 'ats'
  | 'end';

/* -------------------------------------------------------------------------- */
/*  Decisions — the heart of "auto-flow"                                      */
/* -------------------------------------------------------------------------- */

export type Decision = 'present' | 'absent' | null;

/* -------------------------------------------------------------------------- */
/*  Candidate (auto-filled from resume)                                       */
/* -------------------------------------------------------------------------- */

export interface CandidateInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  skills: string[];
  experienceYears: number;
  education: string;
  currentRole?: string;
  atsScore?: number;
  keywordMatches?: string[];
  missingKeywords?: string[];
}

/* -------------------------------------------------------------------------- */
/*  Per-node data                                                             */
/* -------------------------------------------------------------------------- */

export interface BaseNodeData extends Record<string, unknown> {
  title: string;
  decision: Decision;
  stageLabel?: string;
}

export interface StartNodeData extends BaseNodeData {
  kind: 'start';
  metadata: Array<{ key: string; value: string }>;
  /** When true, opens the ATS resume upload on workflow entry */
  requireResume: boolean;
}

export interface TaskNodeData extends BaseNodeData {
  kind: 'task';
  description: string;
  assignee: string;
  dueDate: string;
  customFields: Array<{ key: string; value: string }>;
}

export interface ApprovalNodeData extends BaseNodeData {
  kind: 'approval';
  approverRole: string;
  autoApproveThreshold: number;
}

export interface AutomatedNodeData extends BaseNodeData {
  kind: 'automated';
  actionId: string;
  actionLabel: string;
  actionParams: Record<string, string>;
}

export interface ATSNodeData extends BaseNodeData {
  kind: 'ats';
  minScore: number;
  requiredKeywords: string[];
}

export interface EndNodeData extends BaseNodeData {
  kind: 'end';
  endMessage: string;
  summaryFlag: boolean;
  outcome: 'hired' | 'rejected' | 'withdrawn';
}

export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedNodeData
  | ATSNodeData
  | EndNodeData;

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge<{
  branch: 'present' | 'absent' | 'default';
}>;

/* -------------------------------------------------------------------------- */
/*  Mock API types                                                            */
/* -------------------------------------------------------------------------- */

export interface AutomationAction {
  id: string;
  label: string;
  params: string[];
  description?: string;
}

export interface SimulationStep {
  nodeId: string;
  nodeTitle: string;
  nodeKind: NodeKind;
  decision: Decision;
  status: 'executed' | 'skipped' | 'terminated' | 'waiting';
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SimulationResult {
  success: boolean;
  steps: SimulationStep[];
  terminatedAt?: string;
  terminationReason?: string;
  completedAt?: string;
  finalOutcome?: 'hired' | 'rejected' | 'incomplete';
  durationMs: number;
}

export interface ValidationError {
  type: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  message: string;
}
