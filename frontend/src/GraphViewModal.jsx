// src/GraphViewModal.jsx
import React, { useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider // <<<<---- 1. IMPORTAR ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import './GraphViewModal.css';

const generatePageId = (title) => {
  if (!title) return '';
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

// Componente interno que usa os hooks do ReactFlow
const GraphViewInner = ({ pages, onNodeClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const graphContainerRef = useRef(null); // Ainda pode ser útil para outras coisas, mas não essencial para fitView aqui

  useMemo(() => {
    const numNodes = pages.length;
    if (numNodes === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const baseRadius = 150;
    const radiusIncrement = 30;
    let radius = baseRadius + Math.min(numNodes * radiusIncrement, 800);
    if (numNodes < 5) radius = 250;
    if (numNodes > 20) radius = Math.max(baseRadius + numNodes * 15, 400);

    const centerX = 0;
    const centerY = 0;

    const newNodes = pages.map((page, index) => {
      let x, y;
      if (numNodes === 1) {
        x = centerX;
        y = centerY;
      } else {
        const angle = (index / numNodes) * 2 * Math.PI;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }
      return {
        id: page.id,
        type: 'default',
        data: { label: page.title },
        position: { x, y },
        style: {
          background: page.accentColor || '#3b82f6',
          color: 'white',
          border: '1px solid rgba(0,0,0,0.2)',
          width: 150,
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'center',
          padding: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        },
      };
    });

    const newEdges = [];
    const linkRegex = /\[\[(.*?)\]\]/g;
    pages.forEach(page => {
      let match;
      const pageContent = page.markdown || '';
      while ((match = linkRegex.exec(pageContent)) !== null) {
        const linkedPageTitle = match[1].trim();
        if (linkedPageTitle) {
          const targetNodeId = generatePageId(linkedPageTitle);
          if (newNodes.find(node => node.id === targetNodeId) && page.id !== targetNodeId) {
            newEdges.push({
              id: `e-${page.id}-${targetNodeId}-${Math.random().toString(36).substr(2, 5)}`,
              source: page.id,
              target: targetNodeId,
              type: 'smoothstep',
              animated: false,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#888', width: 15, height: 15 },
              style: { stroke: '#aaa', strokeWidth: 1.5 },
            });
          }
        }
      }
    });
    setNodes(newNodes);
    setEdges(newEdges);
  }, [pages, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]); // fitView é estável, a dependência principal é 'nodes'

  const handleNodeClickInternal = (event, node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }} ref={graphContainerRef}> {/* O ref é opcional aqui agora */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClickInternal}
        attributionPosition="bottom-right"
        nodesDraggable={true}
        nodesConnectable={false}
        zoomOnScroll={true}
        panOnDrag={true}
      >
        <MiniMap nodeColor={(node) => node.style?.background || '#3b82f6'} nodeStrokeWidth={2} zoomable pannable />
        <Controls />
        <Background color="#ddd" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};


// Componente principal do Modal
const GraphViewModal = ({ pages, onClose, onNodeClick }) => {
  return (
    <div className="graph-modal-overlay" onClick={onClose}>
      <div className="graph-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="graph-modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h3>Visualização de Conexões</h3>
        {/* Envolver o componente que usa os hooks do ReactFlow com o Provider */}
        {/* O div com height é importante para o ReactFlow saber suas dimensões */}
        <div style={{ width: '100%', height: 'calc(100% - 70px)', flexGrow: 1 }}> {/* flexGrow para ocupar espaço */}
          <ReactFlowProvider> {/* <<<<---- 2. ENVOLVER com ReactFlowProvider */}
            <GraphViewInner pages={pages} onNodeClick={onNodeClick} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default GraphViewModal;