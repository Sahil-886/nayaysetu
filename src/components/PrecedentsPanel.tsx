'use client';

import React, { useState } from 'react';
import { Gavel, Search, Loader2, Sparkles, Award, Scale, BarChart3, AlertCircle, Bookmark, Tag } from 'lucide-react';

export interface PrecedentItem {
  judgment_id: string;
  case_name: string;
  court: string;
  year: number;
  source_file: string;
  similarity: number;
  snippet: string;
  why_similar: string;
  legal_domain?: string;
  statutes_and_sections?: string[];
  shared_statutes?: string[];
  domain_match?: boolean;
}

interface PrecedentsPanelProps {
  precedents: PrecedentItem[];
  isSearching: boolean;
  onSearchPrecedents: () => void;
  documentLoaded: boolean;
}

export const PrecedentsPanel: React.FC<PrecedentsPanelProps> = ({
  precedents,
  isSearching,
  onSearchPrecedents,
  documentLoaded,
}) => {
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchClick = () => {
    setHasSearched(true);
    onSearchPrecedents();
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 40) return 'text-[#86682B] bg-[#FAF4E8] border-[#C6A15B]/40';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return 'from-emerald-500 to-emerald-400';
    if (score >= 40) return 'from-[#C6A15B] to-[#E5C788]';
    return 'from-slate-400 to-slate-300';
  };

  return (
    <div className="flex flex-col h-full bg-[#12203C] border-l border-[#1B2A4A] overflow-y-auto p-4 space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A] shrink-0">
        <div className="flex items-center space-x-2.5 border-l-[3px] border-[#C6A15B] pl-3">
          <Gavel className="w-[18px] h-[18px] text-[#C6A15B]" />
          <h2 className="font-serif text-[17px] font-bold tracking-wide text-white">
            Similar Precedents
          </h2>
        </div>
        {documentLoaded && (
          <button
            onClick={handleSearchClick}
            disabled={isSearching}
            className="px-3.5 py-1.5 bg-gradient-to-b from-[#D4B373] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#A4813A] text-[#0B1528] font-bold rounded-lg text-xs transition-premium flex items-center space-x-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Search for similar precedents"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Matching...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Find Precedents</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Loading State with Skeleton */}
        {isSearching && (
          <div className="space-y-4 animate-fade-in">
            <div className="py-6 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-lg p-5">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-[#C6A15B] animate-spin mx-auto" />
                <div className="absolute inset-0 rounded-full animate-pulse-glow mx-auto w-8 h-8" />
              </div>
              <div>
                <p className="text-xs text-[#0B1528] font-bold font-serif">Hybrid Legal Relevance Engine...</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Scoring shared statutes (50%), legal domain (25%), key issues (15%), & vector similarity tiebreakers (10%)
                </p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#C6A15B] to-[#E5C788] h-full rounded-full animate-progress" />
              </div>
            </div>

            {/* Skeleton Cards */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`bg-white rounded-xl border border-slate-100 p-5 space-y-3 shadow-md animate-fade-in stagger-${i + 1}`}>
                <div className="skeleton-shimmer h-4 w-3/4" />
                <div className="skeleton-shimmer h-3 w-1/2" />
                <div className="skeleton-shimmer h-1.5 w-full rounded-full" />
                <div className="skeleton-shimmer h-12 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State: No Document */}
        {!documentLoaded && !isSearching && (
          <div className="py-8 text-center p-6 space-y-3 bg-white rounded-xl border border-slate-200 shadow-lg animate-fade-in card-hover">
            <div className="p-3 bg-[#FAF4E8] rounded-2xl w-fit mx-auto border border-[#C6A15B]/20">
              <Scale className="w-6 h-6 text-[#C6A15B]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0B1528] font-serif">Similar Precedents</p>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Upload a court judgment PDF to search for legally-relevant Supreme Court precedents.
              </p>
            </div>
          </div>
        )}

        {/* Empty State: Document Loaded, Search Not Run */}
        {documentLoaded && !hasSearched && precedents.length === 0 && !isSearching && (
          <div className="py-8 text-center p-6 space-y-3 bg-white rounded-xl border border-slate-200 shadow-lg animate-fade-in">
            <div className="p-3 bg-[#FAF4E8] rounded-2xl w-fit mx-auto border border-[#C6A15B]/20">
              <Scale className="w-6 h-6 text-[#C6A15B]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B1528] font-serif">Ready for Precedent Search</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Click <span className="text-[#86682B] font-bold">Find Precedents</span> above to execute hybrid legal statute & domain matching.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 — Honest Empty State: Document Loaded, Search Run, 0 Legally Relevant Precedents Found */}
        {documentLoaded && hasSearched && precedents.length === 0 && !isSearching && (
          <div className="py-8 text-center p-6 space-y-3 bg-white rounded-xl border border-amber-200 shadow-lg animate-fade-in">
            <div className="p-3 bg-amber-50 rounded-2xl w-fit mx-auto border border-amber-200">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B1528] font-serif">No Legally Relevant Precedents Found</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                No indexed Supreme Court precedent shares a statute, legal provision, or legal domain with the uploaded document.
              </p>
            </div>
          </div>
        )}

        {/* Precedent Cards */}
        {precedents.length > 0 && !isSearching && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#E5C788] uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart3 className="w-3 h-3" />
                <span>Top {precedents.length} Hybrid Relevant Matches</span>
              </p>
            </div>

            {precedents.map((prec, idx) => (
              <div
                key={prec.judgment_id || idx}
                className={`bg-white rounded-xl border border-slate-200 hover:border-[#C6A15B]/50 p-4 space-y-3 shadow-lg card-hover animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                {/* Case Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-[#0B1528] font-serif leading-snug">
                      {prec.case_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {prec.court} · {prec.year}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${getSimilarityColor(prec.similarity)}`}>
                    {prec.similarity}% Hybrid Score
                  </span>
                </div>

                {/* Tags: Domain & Shared Statutes */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {prec.legal_domain && (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-[#12203C] text-[#E5C788] px-2 py-0.5 rounded-md border border-[#1B2A4A]">
                      <Tag className="w-2.5 h-2.5 text-[#C6A15B]" />
                      <span>{prec.legal_domain}</span>
                    </span>
                  )}
                  {prec.shared_statutes && prec.shared_statutes.length > 0 && (
                    prec.shared_statutes.map((st, i) => (
                      <span key={i} className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Bookmark className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{st}</span>
                      </span>
                    ))
                  )}
                </div>

                {/* Similarity Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${getBarColor(prec.similarity)} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(100, Math.max(0, prec.similarity))}%` }}
                  />
                </div>

                {/* AI Reasoning / Why Similar */}
                <div className="bg-[#FAF4E8] p-3 rounded-lg border border-[#C6A15B]/15 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#86682B] font-bold text-[9px] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#C6A15B]" />
                    <span>Why Legally Similar</span>
                  </div>
                  <p className="text-[11px] text-[#0B1528] leading-relaxed font-sans font-medium">
                    {prec.why_similar}
                  </p>
                </div>

                {/* Excerpt Snippet */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1 tracking-wider">
                    Matched Case Excerpt
                  </span>
                  <p className="text-[11px] text-slate-600 font-serif leading-relaxed line-clamp-3">
                    {prec.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
