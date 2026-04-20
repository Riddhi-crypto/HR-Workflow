/**
 * Default data blobs for each node kind. Keeping these isolated means
 * adding a new node type is a single-file change.
 */
import type { NodeKind, WorkflowNodeData } from '@/types/workflow';

export function nodeFactoryFor(kind: NodeKind): WorkflowNodeData {
  switch (kind) {
    case 'start':
      return {
        kind: 'start',
        title: 'Application Received',
        decision: null,
        stageLabel: 'Stage 1 · Entry',
        metadata: [{ key: 'source', value: 'careers-site' }],
        requireResume: true,
      };
    case 'task':
      return {
        kind: 'task',
        title: 'Collect Documents',
        decision: null,
        stageLabel: 'Task',
        description: 'Collect ID proof, previous employment letters, and references.',
        assignee: 'HR Operations',
        dueDate: '',
        customFields: [],
      };
    case 'approval':
      return {
        kind: 'approval',
        title: 'Manager Approval',
        decision: null,
        stageLabel: 'Approval',
        approverRole: 'Hiring Manager',
        autoApproveThreshold: 85,
      };
    case 'automated':
      return {
        kind: 'automated',
        title: 'Send Offer Letter',
        decision: null,
        stageLabel: 'Automation',
        actionId: 'generate_doc',
        actionLabel: 'Generate Document',
        actionParams: { template: 'offer-letter-v2', recipient: 'candidate' },
      };
    case 'ats':
      return {
        kind: 'ats',
        title: 'Resume ATS Screen',
        decision: null,
        stageLabel: 'Screening',
        minScore: 70,
        requiredKeywords: ['React', 'TypeScript', 'Python'],
      };
    case 'end':
      return {
        kind: 'end',
        title: 'Workflow Complete',
        decision: null,
        stageLabel: 'Terminal',
        endMessage: 'Workflow has ended.',
        summaryFlag: true,
        outcome: 'hired',
      };
  }
}
