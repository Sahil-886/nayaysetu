'use client';

import React, { useState } from 'react';
import { Sparkles, FileCheck, Loader2, RotateCcw, AlertCircle, BookOpen } from 'lucide-react';
import { useCaseContext } from '@/context/CaseContext';

export default function CaseAnalysisPage() {
  const {
    documentInfo,
    summary,
    judicialChecklist,
    summaryError,
    isSummarizing,
    handleGenerateSummary,
  } = useCaseContext();

  const [activeTab, setActiveTab] = useState<'summary' | 'checklist'>('summary');

  const summaryFields = [
    { key: 'parties', label: 'Parties to Dispute', icon: '⚖️' },
    { key: 'core_issue', label: 'Core Legal Issue', icon: '🎯' },
    { key: 'key_facts', label: 'Material Facts', icon: '📋' },
    { key: 'holding', label: 'Holding & Binding Ratio Decidendi', icon: '🏛️' },
  ] as const;

  const checklistFields = [
    { key: 'relief_sought', label: '1. Relief Sought (Prayer)', icon: '🎯' },
    { key: 'legal_issues', label: '2. Questions of Law', icon: '⚖️' },
    { key: 'statutes_applied', label: '3. Statutes & Provisions Applied', icon: '📜' },
    { key: 'material_facts', label: '4. Material Legally Relevant Facts', icon: '📋' },
    { key: 'procedural_history', label: '5. Procedural History & Rulings', icon: '🏛️' },
    { key: 'holding_ratio', label: '6. Holding & Binding Ratio Decidendi', icon: '⚖️' },
  ] as const;

  if (!documentInfo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-8 space-y-4 shadow-xl">
        <BookOpen className="w-12 h-12 text-[#C6A15B] mx-auto opacity-80" />
        <h2 className="text-xl font-bold font-serif text-white">No Document Currently Loaded</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload a court judgment PDF on the Dashboard to generate structured ratio summaries and judicial checklists.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-8">
      {/* Header & Re-Analyze */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2A4A]">
        <div>
          <h2 className="text-2xl font-bold font-serif text-white tracking-wide">
            Structured Case Analysis
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Ratio decidendi, key facts, and 6-part judicial evaluation checklist for{' '}
            <span className="text-[#E5C788] font-semibold">{documentInfo.fileName}</span>.
          </p>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={isSummarizing}
          className="px-4 py-2 bg-gradient-to-r from-[#D4B373] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#A4813A] text-[#0B1528] font-bold rounded-xl text-xs transition-premium flex items-center space-x-2 shadow-lg disabled:opacity-50"
        >
          {isSummarizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting Ratio...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Re-Analyze Case</span>
            </>
          )}
        </button>
      </div>

      {/* View Mode Toggle Bar */}
      <div className="flex items-center p-1.5 bg-[#0B1528] rounded-xl border border-[#1B2A4A] max-w-md">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold font-serif transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'summary'
              ? 'bg-[#C6A15B] text-[#0B1528] shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-[#12203C]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Case Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold font-serif transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'checklist'
              ? 'bg-[#C6A15B] text-[#0B1528] shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-[#12203C]'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Judicial Checklist</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isSummarizing && (
        <div className="py-12 text-center space-y-4 bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-8">
          <Loader2 className="w-10 h-10 text-[#C6A15B] animate-spin mx-auto" />
          <div>
            <p className="text-sm font-bold text-white font-serif">
              {activeTab === 'summary' ? 'Extracting Summary & Legal Ratio...' : 'Generating 6-Part Judicial Checklist...'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Processing case text with llama3.2</p>
          </div>
        </div>
      )}

      {/* Error View */}
      {summaryError && !isSummarizing && (
        <div className="p-5 bg-rose-950/80 border-l-4 border-rose-500 rounded-xl text-xs space-y-3 shadow-md">
          <div className="flex items-center space-x-2 text-rose-200 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Analysis Failed</span>
          </div>
          <p className="text-rose-300">{summaryError}</p>
          <button
            onClick={handleGenerateSummary}
            className="px-3.5 py-1.5 bg-[#C6A15B] text-[#0B1528] font-bold rounded-lg text-xs"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* TAB 1: Summary View */}
      {activeTab === 'summary' && summary && !isSummarizing && (
        <div className="grid grid-cols-1 gap-4 text-xs">
          {summaryFields.map((field) => {
            const value = summary[field.key];
            if (!value) return null;
            return (
              <div
                key={field.key}
                className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-[#C6A15B] border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl"
              >
                <span className="text-[#C6A15B] font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <span>{field.icon}</span>
                  <span>{field.label}</span>
                </span>
                <p className="text-white font-serif text-sm leading-relaxed whitespace-pre-line">
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Judicial Checklist View */}
      {activeTab === 'checklist' && !isSummarizing && (
        <div className="grid grid-cols-1 gap-4 text-xs">
          {!judicialChecklist ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-6">
              Judicial checklist loading or not yet generated. Click <span className="font-bold text-[#E5C788]">Re-Analyze Case</span> above.
            </div>
          ) : (
            checklistFields.map((field) => {
              const value = (judicialChecklist as any)[field.key] || 'Not stated in document';
              return (
                <div
                  key={field.key}
                  className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-[#C6A15B] border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl"
                >
                  <span className="text-[#C6A15B] font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <span>{field.icon}</span>
                    <span>{field.label}</span>
                  </span>
                  <p className="text-white font-serif text-sm leading-relaxed">
                    {value}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
