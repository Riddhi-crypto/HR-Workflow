import type { AutomationAction } from '@/types/workflow';

/**
 * Mock catalogue of automated actions. In a real product this would come
 * from `GET /automations` — here we simulate latency via the api client.
 */
export const MOCK_AUTOMATIONS: AutomationAction[] = [
  {
    id: 'send_email',
    label: 'Send Email',
    params: ['to', 'subject', 'template'],
    description: 'Dispatches a templated email to the candidate or approver.',
  },
  {
    id: 'generate_doc',
    label: 'Generate Document',
    params: ['template', 'recipient'],
    description: 'Generates offer letters, NDAs, or onboarding packets.',
  },
  {
    id: 'schedule_interview',
    label: 'Schedule Interview',
    params: ['interviewerEmail', 'duration', 'slot'],
    description: 'Books a calendar slot via Outlook/Google Calendar.',
  },
  {
    id: 'background_check',
    label: 'Background Check',
    params: ['provider', 'depth'],
    description: 'Initiates a third-party verification workflow.',
  },
  {
    id: 'create_ticket',
    label: 'Create IT Ticket',
    params: ['system', 'priority', 'description'],
    description: 'Provisions laptop, accounts, and access.',
  },
  {
    id: 'slack_notify',
    label: 'Notify via Slack',
    params: ['channel', 'message'],
    description: 'Posts a message to a Slack channel.',
  },
  {
    id: 'ats_rescore',
    label: 'Re-score Resume',
    params: ['weightProfile'],
    description: 'Runs the ATS scorer again with a new weight profile.',
  },
];
