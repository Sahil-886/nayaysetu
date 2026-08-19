'use client';

import React from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Layers,
  Database,
  CheckCircle,
  ScanSearch,
  ArrowRight,
  MessageSquare,
  Network,
  BookOpen,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useCaseContext } from '@/context/CaseContext';

export default function Dashboard() {
  const {
    documentInfo,
    summary,
    isIngesting,
    error,
    handleFileUpload,
    handleGenerateSummary,
    isSummarizing,
    summaryError,
  } = useCaseContext();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-8">
      {/* Page Title & Intro */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2A4A]">
        <div>
          <h2 className="text-2xl font-bold font-serif text-white tracking-wide">
            Dashboard &amp; Case Overview
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Upload court judgment PDFs and launch instant legal analysis, entity graphs, and grounded Q&amp;A.
          </p>
        </div>
        {documentInfo && (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Case Active</span>
          </span>
        )}
      </div>

      {/* Grid Row 1: Upload Dropzone & Document Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload Zone (7 cols) */}
        <div className="md:col-span-7">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-[#0B1528] rounded-2xl border-2 border-dashed border-[#2A3B5C] hover:border-[#C6A15B] p-8 text-center cursor-pointer transition-all shadow-xl group hover:bg-[#0F1D36]"
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="dashboard-pdf-upload"
            />
            <label htmlFor="dashboard-pdf-upload" className="cursor-pointer block">
              {isIngesting ? (
                <div className="flex flex-col items-center py-6 space-y-4">
                  <Loader2 className="w-10 h-10 text-[#C6A15B] animate-spin mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white font-serif">
                      Parsing &amp; Vectorizing Court PDF...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Generating 768-dim embeddings → local store
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 py-4">
                  <div className="p-4 rounded-full bg-[#12203C] border border-[#2A3B5C] group-hover:border-[#C6A15B]/50 transition-all">
                    <UploadCloud className="w-8 h-8 text-[#C6A15B]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">
                      Upload Court Judgment PDF
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      Drag &amp; drop file here, or click to browse
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-rose-950/80 border-l-4 border-rose-500 rounded-xl text-xs flex items-start space-x-3 shadow-md">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-200">Upload Error</p>
                <p className="text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Document Stats & Status Card (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-6 shadow-xl">
          {documentInfo ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-[#12203C] rounded-xl border border-[#2A3B5C]">
                    <FileText className="w-5 h-5 text-[#C6A15B]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white truncate max-w-[200px]" title={documentInfo.fileName}>
                      {documentInfo.fileName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Indexed Legal Document</p>
                  </div>
                </div>
                {documentInfo.ocrUsed && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center space-x-1">
                    <ScanSearch className="w-3 h-3" />
                    <span>OCR</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-[#1B2A4A]">
                <div className="bg-[#12203C] p-3 rounded-xl border border-[#1B2A4A] text-center">
                  <Layers className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pages</span>
                  <span className="font-bold text-white text-lg">{documentInfo.numPages}</span>
                </div>
                <div className="bg-[#12203C] p-3 rounded-xl border border-[#1B2A4A] text-center">
                  <Database className="w-4 h-4 text-[#C6A15B] mx-auto mb-1" />
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vector Chunks</span>
                  <span className="font-bold text-[#E5C788] text-lg">{documentInfo.totalChunks}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-6 space-y-2">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-medium text-slate-400">No Document Currently Loaded</p>
              <p className="text-[11px] text-slate-500">
                Upload a case PDF to index vectors and unlock multi-page research toolkits.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid Row 2: Quick Summary Card */}
      {documentInfo && (
        <div className="bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#C6A15B]" />
              <h3 className="text-base font-bold text-white font-serif">Case Ratio &amp; Summary Preview</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="px-3 py-1.5 bg-[#C6A15B] hover:bg-[#86682B] text-[#0B1528] font-bold rounded-lg text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-Analyze</span>
                  </>
                )}
              </button>
              <Link
                href="/analysis"
                className="px-3 py-1.5 bg-[#12203C] hover:bg-[#1B2A4A] text-[#E5C788] border border-[#2A3B5C] font-bold rounded-lg text-xs transition-all flex items-center space-x-1"
              >
                <span>Full Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isSummarizing ? (
            <div className="py-6 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-[#C6A15B] animate-spin mx-auto" />
              <p className="text-xs text-slate-300">Extracting legal ratio &amp; ratio decidendi...</p>
            </div>
          ) : summaryError ? (
            <div className="p-3.5 bg-amber-950/60 border-l-4 border-amber-500 rounded-lg text-xs text-amber-200">
              {summaryError}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#12203C] p-4 rounded-xl border border-[#1B2A4A] space-y-1">
                <span className="text-[#C6A15B] font-bold uppercase text-[10px] tracking-wider block">Parties</span>
                <p className="text-white font-serif font-bold text-sm">{summary.parties || 'N/A'}</p>
              </div>
              <div className="bg-[#12203C] p-4 rounded-xl border border-[#1B2A4A] space-y-1">
                <span className="text-[#C6A15B] font-bold uppercase text-[10px] tracking-wider block">Core Legal Issue</span>
                <p className="text-slate-300 font-medium">{summary.core_issue || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Summary generation in progress...
            </div>
          )}
        </div>
      )}

      {/* Grid Row 3: Section Launchpad Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">
          Research Toolkits Launchpad
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/analysis"
            className="group bg-[#0B1528] hover:bg-[#0F1D36] p-5 rounded-2xl border border-[#1B2A4A] hover:border-[#C6A15B] transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#12203C] rounded-xl border border-[#2A3B5C] group-hover:border-[#C6A15B]/50">
                <FileText className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C6A15B] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-white font-serif text-base group-hover:text-[#E5C788] transition-colors">
                Case Analysis
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                View structured 4-part summary &amp; 6-part Judicial Checklist.
              </p>
            </div>
          </Link>

          <Link
            href="/graph"
            className="group bg-[#0B1528] hover:bg-[#0F1D36] p-5 rounded-2xl border border-[#1B2A4A] hover:border-[#C6A15B] transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#12203C] rounded-xl border border-[#2A3B5C] group-hover:border-[#C6A15B]/50">
                <Network className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C6A15B] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-white font-serif text-base group-hover:text-[#E5C788] transition-colors">
                Entity Graph
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Full-page SVG diagram of entities, courts, &amp; relationships.
              </p>
            </div>
          </Link>

          <Link
            href="/chat"
            className="group bg-[#0B1528] hover:bg-[#0F1D36] p-5 rounded-2xl border border-[#1B2A4A] hover:border-[#C6A15B] transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#12203C] rounded-xl border border-[#2A3B5C] group-hover:border-[#C6A15B]/50">
                <MessageSquare className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C6A15B] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-white font-serif text-base group-hover:text-[#E5C788] transition-colors">
                Grounded Q&amp;A
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Ask questions with strict paragraph &amp; page citations.
              </p>
            </div>
          </Link>

          <Link
            href="/precedents"
            className="group bg-[#0B1528] hover:bg-[#0F1D36] p-5 rounded-2xl border border-[#1B2A4A] hover:border-[#C6A15B] transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#12203C] rounded-xl border border-[#2A3B5C] group-hover:border-[#C6A15B]/50">
                <BookOpen className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C6A15B] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-white font-serif text-base group-hover:text-[#E5C788] transition-colors">
                Precedents
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Find similar Supreme Court &amp; High Court rulings.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
