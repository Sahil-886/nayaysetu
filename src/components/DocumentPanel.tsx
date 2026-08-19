'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  CheckCircle,
  Loader2,
  AlertCircle,
  Database,
  Layers,
  RotateCcw,
  Scale,
  FileCheck,
  Network,
} from 'lucide-react';
import { RelationshipGraph, GraphData } from './RelationshipGraph';

export interface SummaryData {
  parties?: string;
  core_issue?: string;
  key_facts?: string;
  holding?: string;
}

export interface JudicialChecklistData {
  relief_sought?: string;
  legal_issues?: string;
  statutes_applied?: string;
  material_facts?: string;
  procedural_history?: string;
  holding_ratio?: string;
}

interface DocumentPanelProps {
  documentInfo: {
    fileName: string;
    numPages: number;
    totalChunks: number;
    documentId: string;
  } | null;
  summary: SummaryData | null;
  judicialChecklist?: JudicialChecklistData | null;
  summaryError?: string | null;
  graphData?: GraphData | null;
  isGeneratingGraph?: boolean;
  graphError?: string | null;
  isIngesting: boolean;
  isSummarizing: boolean;
  onFileUpload: (file: File) => void;
  onGenerateSummary: () => void;
  onFetchGraph?: () => void;
  error?: string | null;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documentInfo,
  summary,
  judicialChecklist,
  summaryError,
  graphData,
  isGeneratingGraph,
  graphError,
  isIngesting,
  isSummarizing,
  onFileUpload,
  onGenerateSummary,
  onFetchGraph,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'checklist' | 'graph'>('summary');
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const summaryFields = [
    { key: 'parties', label: 'Parties', icon: '⚖️' },
    { key: 'core_issue', label: 'Core Legal Issue', icon: '🎯' },
    { key: 'key_facts', label: 'Key Facts', icon: '📋' },
    { key: 'holding', label: 'Holding & Ratio Decidendi', icon: '🏛️' },
  ] as const;

  const checklistFields = [
    { key: 'relief_sought', label: '1. Relief Sought (Prayer)', icon: '🎯' },
    { key: 'legal_issues', label: '2. Questions of Law', icon: '⚖️' },
    { key: 'statutes_applied', label: '3. Statutes & Provisions Applied', icon: '📜' },
    { key: 'material_facts', label: '4. Material Legally Relevant Facts', icon: '📋' },
    { key: 'procedural_history', label: '5. Procedural History & Rulings', icon: '🏛️' },
    { key: 'holding_ratio', label: '6. Holding & Binding Ratio Decidendi', icon: '⚖️' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#12203C] border-r border-[#1B2A4A] overflow-y-auto p-4 space-y-4">
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A] shrink-0">
        <div className="flex items-center space-x-2.5 border-l-[3px] border-[#C6A15B] pl-3">
          <BookOpen className="w-[18px] h-[18px] text-[#C6A15B]" />
          <h2 className="font-serif text-[17px] font-bold tracking-wide text-white">
            Case Document &amp; Analysis
          </h2>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-xl border-2 border-dashed p-5 text-center cursor-pointer group shadow-lg transition-premium animate-fade-in-up ${
          isDragging
            ? 'border-[#C6A15B] bg-[#FAF4E8] scale-[1.01]'
            : 'border-slate-300 hover:border-[#C6A15B] hover:bg-[#FEFDFB]'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
          aria-label="Upload court judgment PDF"
        />
        <label htmlFor="pdf-upload-input" className="cursor-pointer block">
          {isIngesting ? (
            <div className="flex flex-col items-center py-4 space-y-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-[#C6A15B] animate-spin" />
                <div className="absolute inset-0 rounded-full animate-pulse-glow" />
              </div>
              <div>
                <p className="text-sm text-[#0B1528] font-bold font-serif">Parsing &amp; Vectorizing PDF...</p>
                <p className="text-[11px] text-slate-500 mt-1">Generating 768-dim embeddings → pgvector</p>
              </div>
              <div className="w-full max-w-[200px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#C6A15B] to-[#E5C788] h-full rounded-full animate-progress" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 py-2">
              <div className={`p-3.5 rounded-full border transition-premium ${
                isDragging
                  ? 'bg-[#C6A15B]/20 border-[#C6A15B]/50'
                  : 'bg-slate-50 border-slate-200 group-hover:bg-[#FAF4E8] group-hover:border-[#C6A15B]/40'
              }`}>
                <UploadCloud className={`w-7 h-7 transition-premium ${
                  isDragging ? 'text-[#86682B]' : 'text-slate-400 group-hover:text-[#C6A15B]'
                }`} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1528] font-serif">
                  Upload Court Judgment PDF
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Drag &amp; drop or click to browse
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border-l-[3px] border-rose-500 rounded-xl text-xs flex items-start space-x-2.5 shadow-md animate-scale-in" role="alert">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800 text-[11px] uppercase tracking-wider">Error</p>
            <p className="text-rose-700 mt-0.5 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Document Metadata Card */}
      {documentInfo && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 shadow-lg animate-fade-in-up card-hover">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#0B1528] rounded-lg">
                <FileText className="w-[18px] h-[18px] text-[#C6A15B]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0B1528] truncate max-w-[170px]" title={documentInfo.fileName}>
                  {documentInfo.fileName}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Indexed Legal Document</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-[#2C7A4B] border border-emerald-200 flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Indexed</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center transition-premium hover:border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
              <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Pages</span>
              <span className="font-bold text-[#0B1528] text-base">{documentInfo.numPages}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center transition-premium hover:border-slate-200">
              <Database className="w-3.5 h-3.5 text-[#C6A15B] mx-auto mb-1" />
              <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Vectors</span>
              <span className="font-bold text-[#86682B] text-base">{documentInfo.totalChunks}</span>
            </div>
          </div>
        </div>
      )}

      {/* Structured Analysis Card (Summary + Judicial Checklist Tabs) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-lg animate-fade-in-up">
        {/* Header & Tab Toggle */}
        <div className="flex flex-col space-y-3 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#C6A15B]" />
              <h3 className="text-sm font-bold text-[#0B1528] font-serif">Case Analysis</h3>
            </div>
            {documentInfo && (
              <button
                onClick={onGenerateSummary}
                disabled={isSummarizing}
                className="px-3.5 py-1.5 bg-gradient-to-b from-[#D4B373] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#A4813A] text-[#0B1528] font-bold rounded-lg text-xs transition-premium flex items-center space-x-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Generate or retry analysis"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : summaryError ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Analysis</span>
                  </>
                ) : (
                  <span>Re-Analyze</span>
                )}
              </button>
            )}
          </div>

          {/* View Mode Toggle: Summary vs Judicial Checklist vs Entity Graph */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl space-x-1 border border-slate-200/60">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold font-serif transition-premium flex items-center justify-center space-x-1 ${
                activeTab === 'summary'
                  ? 'bg-[#12203C] text-[#E5C788] shadow-md border border-[#1B2A4A]'
                  : 'text-slate-600 hover:text-[#0B1528] hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold font-serif transition-premium flex items-center justify-center space-x-1 ${
                activeTab === 'checklist'
                  ? 'bg-[#12203C] text-[#E5C788] shadow-md border border-[#1B2A4A]'
                  : 'text-slate-600 hover:text-[#0B1528] hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Checklist</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('graph');
                if (!graphData && onFetchGraph) onFetchGraph();
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold font-serif transition-premium flex items-center justify-center space-x-1 ${
                activeTab === 'graph'
                  ? 'bg-[#12203C] text-[#E5C788] shadow-md border border-[#1B2A4A]'
                  : 'text-slate-600 hover:text-[#0B1528] hover:bg-slate-200/50'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Entity Graph</span>
            </button>
          </div>
        </div>

        {/* Summarizing Skeleton */}
        {isSummarizing && (
          <div className="py-5 text-center space-y-3 border border-[#C6A15B]/20 rounded-lg bg-gradient-to-b from-[#FAF4E8] to-white animate-scale-in">
            <Loader2 className="w-7 h-7 text-[#C6A15B] animate-spin mx-auto" />
            <div>
              <p className="text-xs text-[#0B1528] font-bold font-serif">
                {activeTab === 'summary' ? 'Extracting Summary & Ratio...' : 'Generating 6-Part Judicial Checklist...'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Processing document text strictly with llama3.2</p>
            </div>
            <div className="space-y-2.5 px-4 pt-2">
              {[...Array(activeTab === 'checklist' ? 6 : 4)].map((_, i) => (
                <div key={i} className={`skeleton-shimmer h-4 rounded animate-fade-in-up`} style={{ width: `${85 - i * 10}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Summary / Analysis Visible Error State */}
        {summaryError && !isSummarizing && (
          <div className="p-4 bg-amber-50 border-l-[3px] border-amber-500 rounded-lg text-xs space-y-2.5 shadow-sm animate-scale-in">
            <div className="flex items-center space-x-2 text-amber-800 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Analysis Generation Failed</span>
            </div>
            <p className="text-amber-900 text-[11px] font-medium leading-relaxed">{summaryError}</p>
            <button
              onClick={onGenerateSummary}
              className="px-3 py-1.5 bg-[#C6A15B] hover:bg-[#86682B] text-[#0B1528] font-bold rounded text-[11px] transition-premium shadow-xs flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}

        {/* Initial Empty State */}
        {!summary && !isSummarizing && !summaryError && (
          <div className="py-6 text-center p-4 bg-slate-50/80 rounded-xl border border-slate-100/80 space-y-2">
            {documentInfo ? (
              <div className="space-y-2 animate-fade-in">
                <Sparkles className="w-5 h-5 text-[#C6A15B] mx-auto animate-pulse" />
                <p className="text-xs text-slate-600 font-medium font-sans">
                  Extracting structured legal ratio &amp; judicial checklist...
                </p>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <div className="p-2.5 bg-white rounded-xl w-fit mx-auto border border-slate-200/60 shadow-xs">
                  <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                </div>
                <p className="text-xs text-slate-500 font-medium font-sans leading-relaxed">
                  Upload a judgment PDF to generate a structured summary &amp; judicial checklist.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: Structured Summary View (4 Fields) */}
        {activeTab === 'summary' && summary && !isSummarizing && (
          <div className="space-y-3 text-xs animate-fade-in">
            {summaryFields.map((field, idx) => {
              const value = summary[field.key];
              if (!value) return null;
              return (
                <div
                  key={field.key}
                  className={`bg-slate-50 p-3.5 rounded-lg border-l-[3px] border-[#C6A15B] border-t border-r border-b border-slate-100 animate-fade-in-up stagger-${idx + 1}`}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <span className="text-[#86682B] font-bold block text-[10px] uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <span>{field.icon}</span>
                    <span>{idx + 1}. {field.label}</span>
                  </span>
                  <p className={`leading-relaxed ${
                    field.key === 'parties' || field.key === 'holding'
                      ? 'text-[#0B1528] font-serif font-semibold text-[13px]'
                      : 'text-slate-700 font-medium'
                  } ${field.key === 'key_facts' ? 'whitespace-pre-line' : ''}`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Judicial Checklist View (6 Fields) */}
        {activeTab === 'checklist' && !isSummarizing && (
          <div className="space-y-3 text-xs animate-fade-in">
            {!judicialChecklist ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100 p-4 font-sans">
                Judicial checklist loading or not yet generated. Click <span className="font-bold text-[#86682B]">Re-Analyze</span> above to generate.
              </div>
            ) : (
              checklistFields.map((field, idx) => {
                const value = (judicialChecklist as any)[field.key] || 'Not stated in document';
                return (
                  <div
                    key={field.key}
                    className={`bg-slate-50 p-3.5 rounded-lg border-l-[3px] border-[#C6A15B] border-t border-r border-b border-slate-100 animate-fade-in-up stagger-${idx + 1}`}
                    style={{ animationDelay: `${idx * 0.06}s` }}
                  >
                    <span className="text-[#86682B] font-bold block text-[10px] uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <span>{field.icon}</span>
                      <span>{field.label}</span>
                    </span>
                    <p className={`leading-relaxed ${
                      field.key === 'holding_ratio' || field.key === 'relief_sought'
                        ? 'text-[#0B1528] font-serif font-semibold text-[12.5px]'
                        : value === 'Not stated in document'
                        ? 'text-slate-400 italic font-sans'
                        : 'text-slate-700 font-medium font-sans'
                    }`}>
                      {value}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: Legal Relationship Graph View */}
        {activeTab === 'graph' && !isSummarizing && (
          <div className="space-y-3 animate-fade-in">
            {isGeneratingGraph ? (
              <div className="py-8 text-center space-y-3 border border-[#C6A15B]/20 rounded-lg bg-[#0B1528]">
                <Loader2 className="w-7 h-7 text-[#C6A15B] animate-spin mx-auto" />
                <p className="text-xs text-[#E5C788] font-bold font-serif">
                  Extracting Legal Entities &amp; Relationships...
                </p>
                <p className="text-[11px] text-slate-400">Processing graph topology with llama3.2</p>
              </div>
            ) : graphError ? (
              <div className="p-3.5 bg-rose-50 border-l-[3px] border-rose-500 rounded-lg text-xs space-y-2">
                <p className="font-bold text-rose-800 font-bold">Graph Extraction Error</p>
                <p className="text-rose-700">{graphError}</p>
                {onFetchGraph && (
                  <button
                    onClick={onFetchGraph}
                    className="px-3 py-1 bg-[#C6A15B] text-[#0B1528] font-bold rounded text-[11px]"
                  >
                    Retry Extraction
                  </button>
                )}
              </div>
            ) : graphData ? (
              <RelationshipGraph graph={graphData} />
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border p-4 font-sans">
                No graph extracted yet. Upload a document or click <span className="font-bold text-[#86682B]">Entity Graph</span> to generate.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case Timeline Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg animate-fade-in-up">
        <button
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-premium"
          aria-expanded={timelineOpen}
          aria-controls="case-timeline-content"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-[#0B1528] font-serif">Case Procedural Timeline</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-[#FAF4E8] text-[#86682B] rounded border border-[#C6A15B]/20">
              Coming Soon
            </span>
            {timelineOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
            )}
          </div>
        </button>

        {timelineOpen && (
          <div id="case-timeline-content" className="p-4 border-t border-slate-100 space-y-3 text-xs bg-slate-50 animate-fade-in">
            <div className="flex items-start space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-[#2C7A4B] mt-1.5 shrink-0 ring-2 ring-emerald-200" />
              <div>
                <p className="font-bold text-[#0B1528]">High Court Writ Petition</p>
                <p className="text-[11px] text-slate-500">Interim stay order granted &amp; referred to Division Bench.</p>
              </div>
            </div>
            <div className="ml-1 w-px h-4 bg-slate-300" />
            <div className="flex items-start space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-[#C6A15B] mt-1.5 shrink-0 ring-2 ring-[#FAF4E8]" />
              <div>
                <p className="font-bold text-[#0B1528]">Supreme Court SLP Admitted</p>
                <p className="text-[11px] text-slate-500">Special leave petition referred to Constitution Bench.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
