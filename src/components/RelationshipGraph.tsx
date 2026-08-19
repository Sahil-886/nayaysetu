'use client';

import React, { useState } from 'react';
import { User, Building, Landmark, Scale, Calendar, Info } from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationshipGraphProps {
  graph: GraphData;
}

const TYPE_COLORS: Record<string, { fill: string; stroke: string; text: string; label: string }> = {
  person: { fill: '#3B82F6', stroke: '#60A5FA', text: '#FFFFFF', label: 'Person / Party' },
  company: { fill: '#0EA5E9', stroke: '#38BDF8', text: '#FFFFFF', label: 'Entity / Corporate' },
  court: { fill: '#8B5CF6', stroke: '#A78BFA', text: '#FFFFFF', label: 'Court / Forum' },
  statute: { fill: '#C6A15B', stroke: '#E5C788', text: '#0B1528', label: 'Statute / Law' },
  event: { fill: '#F59E0B', stroke: '#FBBF24', text: '#0B1528', label: 'Event / Action' },
  default: { fill: '#64748B', stroke: '#94A3B8', text: '#FFFFFF', label: 'Other Entity' },
};

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ graph }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  if (nodes.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 font-medium">
        No entities extracted for this document.
      </div>
    );
  }

  // Position nodes in a circular layout
  const width = 440;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2 - 10;
  const radius = Math.min(width, height) / 2 - 50;

  const nodePositions = nodes.reduce((acc, node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    acc[node.id] = { x, y };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  // Helper to check if edge connects to selected node
  const isEdgeConnected = (edge: GraphEdge) => {
    if (!selectedNodeId) return true;
    return edge.from === selectedNodeId || edge.to === selectedNodeId;
  };

  // Helper to check if node is selected or connected to selected node
  const isNodeHighlighted = (nodeId: string) => {
    if (!selectedNodeId) return true;
    if (nodeId === selectedNodeId) return true;
    return edges.some(
      (e) => (e.from === selectedNodeId && e.to === nodeId) || (e.to === selectedNodeId && e.from === nodeId)
    );
  };

  return (
    <div className="flex flex-col space-y-3 animate-fade-in">
      {/* SVG Canvas Container */}
      <div className="relative bg-[#0B1528] rounded-xl border border-[#1B2A4A] p-2 shadow-inner overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] select-none"
        >
          <defs>
            {/* Arrowhead Markers */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="18"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill="#C6A15B" opacity="0.8" />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="10"
              markerHeight="10"
              refX="20"
              refY="5"
              orient="auto"
            >
              <polygon points="0 0, 10 5, 0 10" fill="#E5C788" />
            </marker>
          </defs>

          {/* Render Edges */}
          {edges.map((edge, idx) => {
            const start = nodePositions[edge.from];
            const end = nodePositions[edge.to];
            if (!start || !end) return null;

            const connected = isEdgeConnected(edge);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <g key={`edge-${idx}`} className="transition-opacity duration-200" opacity={connected ? 1 : 0.15}>
                {/* Connection Line */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={connected && selectedNodeId ? '#E5C788' : '#C6A15B'}
                  strokeWidth={connected && selectedNodeId ? 2.5 : 1.5}
                  strokeDasharray={connected ? 'none' : '4,4'}
                  markerEnd={connected && selectedNodeId ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                  opacity={0.7}
                />
                {/* Edge Label Badge */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-45"
                    y="-9"
                    width="90"
                    height="16"
                    rx="4"
                    fill="#12203C"
                    stroke="#1B2A4A"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#E5C788"
                    fontSize="9"
                    fontWeight="600"
                    className="font-sans"
                  >
                    {edge.label.length > 15 ? edge.label.slice(0, 14) + '…' : edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const colorScheme = TYPE_COLORS[node.type] || TYPE_COLORS.default;
            const highlighted = isNodeHighlighted(node.id);
            const isSelected = selectedNodeId === node.id;

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                className="cursor-pointer group transition-transform duration-200 hover:scale-105"
                opacity={highlighted ? 1 : 0.25}
              >
                {/* Node Halo Ring on Selection */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#E5C788"
                    strokeWidth="2"
                    className="animate-ping opacity-50"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="18"
                  fill={colorScheme.fill}
                  stroke={isSelected ? '#FFFFFF' : colorScheme.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="shadow-lg transition-all"
                />

                {/* Node Label Text Below Node */}
                <g transform="translate(0, 30)">
                  <rect
                    x="-55"
                    y="-10"
                    width="110"
                    height="18"
                    rx="4"
                    fill="#12203C"
                    stroke={isSelected ? '#C6A15B' : '#1B2A4A'}
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="10"
                    fontWeight="700"
                    className="font-serif select-none"
                  >
                    {node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Node Details Header */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-400 bg-[#12203C]/90 px-3 py-1.5 rounded-lg border border-[#1B2A4A] backdrop-blur-xs">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>
              {selectedNodeId
                ? `Node "${nodes.find((n) => n.id === selectedNodeId)?.label}" selected`
                : 'Click any entity node to highlight connections'}
            </span>
          </div>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-[#E5C788] hover:underline font-bold uppercase tracking-wider text-[9px]"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Entity Color Legend */}
      <div className="flex items-center justify-center space-x-3 flex-wrap text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 gap-y-1">
        {Object.entries(TYPE_COLORS)
          .filter(([key]) => key !== 'default')
          .map(([typeKey, cfg]) => (
            <div key={typeKey} className="flex items-center space-x-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: cfg.fill }}
              />
              <span className="font-medium text-slate-700">{cfg.label}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
