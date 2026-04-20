/**
 * Workflow canvas. Thin wrapper around <ReactFlow /> that binds the
 * store to the React Flow event model.
 */

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflow } from '@/store/workflowStore';
import { NODE_TYPES } from '@/components/nodes';
import type { NodeKind, WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface Props {
  onInit?: (rf: ReactFlowInstance<WorkflowNode, WorkflowEdge>) => void;
}

export function WorkflowCanvas({ onInit }: Props) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    connect,
    selectNode,
    addNode,
  } = useWorkflow();
  const { screenToFlowPosition } = useReactFlow();

  const handleConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      const branch =
        c.sourceHandle === 'present'
          ? 'present'
          : c.sourceHandle === 'absent'
          ? 'absent'
          : 'default';
      connect(c.source, c.target, branch, c.sourceHandle);
    },
    [connect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData(
        'application/x-workflow-node',
      ) as NodeKind | '';
      if (!kind) return;

      // Project screen coords to graph coords so drops work under pan/zoom
      const position = screenToFlowPosition({
        x: e.clientX - 128,
        y: e.clientY - 40,
      });
      addNode(kind, position);
    },
    [addNode, screenToFlowPosition],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onInit={onInit}
        onNodeClick={(_, n) => selectNode(n.id)}
        onPaneClick={() => selectNode(null)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color="#d0d0c8"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="!bg-white"
        />
        <MiniMap
          nodeColor={(n) => {
            const kind = (n.data as any)?.kind;
            return (
              {
                start: '#0891b2',
                task: '#2563eb',
                approval: '#9333ea',
                automated: '#ea580c',
                ats: '#059669',
                end: '#6b7280',
              } as Record<string, string>
            )[kind] ?? '#999';
          }}
          maskColor="rgba(250,250,247,0.85)"
          className="!border !border-ink-200 !bg-white"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
