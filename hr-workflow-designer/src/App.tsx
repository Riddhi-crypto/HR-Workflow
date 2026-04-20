import { useState } from 'react';
import { TopBar } from '@/components/panels/TopBar';
import { NodePalette } from '@/components/panels/NodePalette';
import { Inspector } from '@/components/panels/Inspector';
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas';
import { ATSModal } from '@/features/ats/ATSModal';
import { SimulatorPanel } from '@/features/simulator/SimulatorPanel';

export default function App() {
  const [atsOpen, setAtsOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <TopBar
        onOpenATS={() => setAtsOpen(true)}
        onOpenSimulator={() => setSimOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <NodePalette />
        <main className="relative min-w-0 flex-1">
          <WorkflowCanvas />
        </main>
        <Inspector />
      </div>

      <ATSModal open={atsOpen} onClose={() => setAtsOpen(false)} />
      <SimulatorPanel open={simOpen} onClose={() => setSimOpen(false)} />
    </div>
  );
}
