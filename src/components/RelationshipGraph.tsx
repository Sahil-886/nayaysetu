'use client';

import React, { useState } from 'react';
import { Info, ShieldCheck, X } from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  detail?: string;
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
      <div className="py-12 text-center text-xs text-slate-400 font-medium">
        No entities extracted for this document.
      </div>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Position nodes in a spacious, stable circular layout
  const width = 840;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 80;

  const nodePositions = nodes.reduce((acc, node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    acc[node.id] = { x, y };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  const isEdgeConnected = (edge: GraphEdge) => {
    if (!selectedNodeId) return true;
    return edge.from === selectedNodeId || edge.to === selectedNodeId;
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (!selectedNodeId) return true;
    if (nodeId === selectedNodeId) return true;
    return edges.some(
      (e) => (e.from === selectedNodeId && e.to === nodeId) || (e.to === selectedNodeId && e.from === nodeId)
    );
  };

  return (
    <div className="flex flex-col space-y-4 animate-fade-in">
      {/* SVG Canvas Container */}
      <div className="relative bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-4 shadow-2xl overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[500px] select-none"
        >
          <defs>
            {/* Arrowhead Markers */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="25"
              refY="5"
              orient="auto"
            >
              <polygon points="0 0, 10 5, 0 10" fill="#C6A15B" opacity="0.9" />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="12"
              markerHeight="12"
              refX="27"
              refY="6"
              orient="auto"
            >
              <polygon points="0 0, 12 6, 0 12" fill="#E5C788" />
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

            // Compute edge label text length for pill background width
            const labelLen = edge.label.length;
            const labelPillWidth = Math.max(90, labelLen * 7 + 20);
            const labelPillHalf = labelPillWidth / 2;

            return (
              <g key={`edge-${idx}`} opacity={connected ? 1 : 0.15}>
                {/* Connection Line */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={connected && selectedNodeId ? '#E5C788' : '#C6A15B'}
                  strokeWidth={connected && selectedNodeId ? 3 : 2}
                  strokeDasharray={connected ? 'none' : '6,6'}
                  markerEnd={connected && selectedNodeId ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                  opacity={0.85}
                />
                {/* Edge Label Pill */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-labelPillHalf}
                    y="-11"
                    width={labelPillWidth}
                    height="22"
                    rx="6"
                    fill="#12203C"
                    stroke="#1B2A4A"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#E5C788"
                    fontSize="10"
                    fontWeight="700"
                    className="font-sans select-none"
                  >
                    {edge.label}
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

            // Compute dynamic pill width to fit FULL untruncated label cleanly
            const labelLength = node.label.length;
            const pillWidth = Math.max(120, labelLength * 7.5 + 24);
            const pillHalfWidth = pillWidth / 2;

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                className="cursor-pointer group"
                opacity={highlighted ? 1 : 0.25}
              >
                {/* Stable Selection Ring */}
                {isSelected && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="#E5C788"
                    strokeWidth="3"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="22"
                  fill={colorScheme.fill}
                  stroke={isSelected ? '#FFFFFF' : colorScheme.stroke}
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  className="shadow-xl"
                />

                {/* Node Letter Badge inside Circle */}
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="800"
                  className="font-mono select-none pointer-events-none"
                >
                  {node.type.slice(0, 1).toUpperCase()}
                </text>

                {/* Full Untruncated Label Badge Below Node */}
                <g transform="translate(0, 36)" className="pointer-events-none">
                  <rect
                    x={-pillHalfWidth}
                    y="-12"
                    width={pillWidth}
                    height="24"
                    rx="6"
                    fill="#12203C"
                    stroke={isSelected ? '#C6A15B' : '#1B2A4A'}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity="0.95"
                    className="shadow-md"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="11"
                    fontWeight="700"
                    className="font-serif select-none"
                  >
                    {node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Navigation Banner */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300 bg-[#12203C]/95 px-4 py-2.5 rounded-xl border border-[#1B2A4A] backdrop-blur-md shadow-lg">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#C6A15B]" />
            <span>
              {selectedNode
                ? `Selected: "${selectedNode.label}"`
                : 'Click any entity node to highlight connections & view grounded facts'}
            </span>
          </div>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-[#E5C788] hover:underline font-bold uppercase tracking-wider text-[10px]"
            >
              Reset Selection
            </button>
          )}
        </div>
      </div>

      {/* Grounded Entity Detail Popover Modal / Card */}
      {selectedNode && (
        <div className="bg-[#0B1528] rounded-2xl border-2 border-[#C6A15B]/50 p-6 shadow-2xl animate-fade-in-up space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B2A4A] pb-3">
            <div className="flex items-center space-x-3">
              <span
                className="w-4 h-4 rounded-full inline-block shrink-0"
                style={{ backgroundColor: (TYPE_COLORS[selectedNode.type] || TYPE_COLORS.default).fill }}
              />
              <div>
                <h3 className="text-base font-bold text-white font-serif">{selectedNode.label}</h3>
                <span className="text-[10px] uppercase font-mono font-bold text-[#C6A15B] tracking-wider">
                  {(TYPE_COLORS[selectedNode.type] || TYPE_COLORS.default).label}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Grounded in Judgment</span>
              </span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1 hover:bg-[#12203C] rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#12203C] p-4 rounded-xl border border-[#1B2A4A] space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#C6A15B] tracking-wider block font-mono">
              Grounded Legal Role &amp; Context
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-serif">
              {selectedNode.detail || 'No further detail found in document.'}
            </p>
          </div>
        </div>
      )}

      {/* Entity Color Legend */}
      <div className="flex items-center justify-center space-x-4 flex-wrap text-xs bg-[#0B1528] p-3 rounded-xl border border-[#1B2A4A] gap-y-2">
        {Object.entries(TYPE_COLORS)
          .filter(([key]) => key !== 'default')
          .map(([typeKey, cfg]) => (
            <div key={typeKey} className="flex items-center space-x-2">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: cfg.fill }}
              />
              <span className="font-medium text-slate-300">{cfg.label}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
