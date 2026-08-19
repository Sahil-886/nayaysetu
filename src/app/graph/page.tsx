'use client';

import React, { useEffect } from 'react';
import { Network, Loader2, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { RelationshipGraph } from '@/components/RelationshipGraph';
import { useCaseContext } from '@/context/CaseContext';

export default function EntityGraphPage() {
  const {
    documentInfo,
    graphData,
    isGeneratingGraph,
    graphError,
    fetchGraph,
  } = useCaseContext();

  useEffect(() => {
    if (documentInfo && !graphData && !isGeneratingGraph && !graphError) {
      fetchGraph();
    }
  }, [documentInfo, graphData, isGeneratingGraph, graphError, fetchGraph]);

  if (!documentInfo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-8 space-y-4 shadow-xl">
        <Network className="w-12 h-12 text-[#C6A15B] mx-auto opacity-80" />
        <h2 className="text-xl font-bold font-serif text-white">No Document Currently Loaded</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload a court judgment PDF on the Dashboard to extract and render the legal entity relationship graph.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2A4A]">
        <div>
          <h2 className="text-2xl font-bold font-serif text-white tracking-wide">
            Legal Entity &amp; Relationship Graph
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Visual network topology of parties, courts, statutes, and events extracted from{' '}
            <span className="text-[#E5C788] font-semibold">{documentInfo.fileName}</span>.
          </p>
        </div>
        <button
          onClick={fetchGraph}
          disabled={isGeneratingGraph}
          className="px-4 py-2 bg-gradient-to-r from-[#D4B373] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#A4813A] text-[#0B1528] font-bold rounded-xl text-xs transition-premium flex items-center space-x-2 shadow-lg disabled:opacity-50"
        >
          {isGeneratingGraph ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting Network...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Re-Extract Graph</span>
            </>
          )}
        </button>
      </div>

      {/* Loading View */}
      {isGeneratingGraph && (
        <div className="py-16 text-center space-y-4 bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-8 shadow-xl">
          <Loader2 className="w-10 h-10 text-[#C6A15B] animate-spin mx-auto" />
          <div>
            <p className="text-sm font-bold text-white font-serif">
              Extracting Legal Entities &amp; Relationship Edges...
            </p>
            <p className="text-xs text-slate-400 mt-1">Processing graph topology with llama3.2</p>
          </div>
        </div>
      )}

      {/* Error View */}
      {graphError && !isGeneratingGraph && (
        <div className="p-5 bg-rose-950/80 border-l-4 border-rose-500 rounded-xl text-xs space-y-3 shadow-md">
          <div className="flex items-center space-x-2 text-rose-200 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Graph Extraction Error</span>
          </div>
          <p className="text-rose-300">{graphError}</p>
          <button
            onClick={fetchGraph}
            className="px-3.5 py-1.5 bg-[#C6A15B] text-[#0B1528] font-bold rounded-lg text-xs"
          >
            Retry Extraction
          </button>
        </div>
      )}

      {/* Full Page Relationship Graph View */}
      {graphData && !isGeneratingGraph && (
        <div className="bg-[#0B1528] p-6 rounded-2xl border border-[#1B2A4A] shadow-2xl space-y-4">
          <RelationshipGraph graph={graphData} />
        </div>
      )}
    </div>
  );
}
