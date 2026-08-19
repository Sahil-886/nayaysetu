'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { PrecedentsPanel } from '@/components/PrecedentsPanel';
import { useCaseContext } from '@/context/CaseContext';

export default function PrecedentsMatcherPage() {
  const {
    documentInfo,
    precedents,
    isSearchingPrecedents,
    handleSearchPrecedents,
  } = useCaseContext();

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A] shrink-0">
        <div>
          <h2 className="text-xl font-bold font-serif text-white tracking-wide">
            Supreme Court &amp; High Court Precedent Similarity Matcher
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Vector similarity matching against landmark Indian precedent judgments for{' '}
            <span className="text-[#E5C788] font-semibold">{documentInfo?.fileName || 'loaded case'}</span>.
          </p>
        </div>
      </div>

      {/* Precedents Panel Window */}
      <div className="flex-1 overflow-hidden bg-[#0B1528] rounded-2xl border border-[#1B2A4A] shadow-2xl">
        <PrecedentsPanel
          precedents={precedents}
          isSearching={isSearchingPrecedents}
          onSearchPrecedents={handleSearchPrecedents}
          documentLoaded={Boolean(documentInfo)}
        />
      </div>
    </div>
  );
}
