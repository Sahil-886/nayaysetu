'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  UploadCloud,
  Loader2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Clock,
  HelpCircle,
  FileSearch,
} from 'lucide-react';
import { PublicChatPanel } from '@/components/PublicChatPanel';
import { FreeLegalHelpCard } from '@/components/FreeLegalHelpCard';
import { useCaseContext } from '@/context/CaseContext';

export default function PublicKnowYourRightsPage() {
  const {
    publicMessages,
    isAskingPublic,
    handleSendPublicMessage,
    documentInfo,
    isIngesting,
    handleFileUpload,
    publicExplanation,
    isExplainingPublicDoc,
    publicExplainError,
    fetchPublicDocExplanation,
    language,
  } = useCaseContext();

  const [activeTab, setActiveTab] = useState<'rights_chat' | 'doc_explainer'>('rights_chat');

  // Auto-trigger explanation if document is loaded and explainer tab is opened
  useEffect(() => {
    if (activeTab === 'doc_explainer' && documentInfo && !publicExplanation && !isExplainingPublicDoc && !publicExplainError) {
      fetchPublicDocExplanation();
    }
  }, [activeTab, documentInfo, publicExplanation, isExplainingPublicDoc, publicExplainError, fetchPublicDocExplanation, language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#1B2A4A] gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-white tracking-wide flex items-center space-x-2">
            <span>Know Your Rights &amp; Legal Explainer</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Simplified legal guidance for citizens &amp; plain-language explanations of court orders, notices, and legal documents.
          </p>
        </div>

        {/* View Switcher: Rights Chat vs Document Explainer */}
        <div className="flex items-center p-1 bg-[#0B1528] rounded-xl border border-[#1B2A4A] shrink-0">
          <button
            onClick={() => setActiveTab('rights_chat')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-serif transition-all flex items-center space-x-2 ${
              activeTab === 'rights_chat'
                ? 'bg-[#C6A15B] text-[#0B1528] shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-[#12203C]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Rights Guidance Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('doc_explainer')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-serif transition-all flex items-center space-x-2 ${
              activeTab === 'doc_explainer'
                ? 'bg-[#C6A15B] text-[#0B1528] shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-[#12203C]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Plain-Language Explainer</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Rights Guidance Chat */}
      {activeTab === 'rights_chat' && (
        <div className="h-[calc(100vh-260px)] min-h-[500px] overflow-hidden bg-[#0B1528] rounded-2xl border border-[#1B2A4A] shadow-2xl">
          <PublicChatPanel
            messages={publicMessages}
            isAsking={isAskingPublic}
            onSendMessage={handleSendPublicMessage}
          />
        </div>
      )}

      {/* VIEW 2: Plain-Language Document Explainer */}
      {activeTab === 'doc_explainer' && (
        <div className="space-y-6 animate-fade-in">
          {/* Upload Dropzone Card */}
          <div className="bg-[#0B1528] rounded-2xl border-2 border-dashed border-[#2A3B5C] hover:border-[#C6A15B] p-6 text-center shadow-xl transition-all">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="public-doc-upload"
            />
            <label htmlFor="public-doc-upload" className="cursor-pointer block">
              {isIngesting ? (
                <div className="flex flex-col items-center py-4 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#C6A15B] animate-spin" />
                  <p className="text-xs font-bold text-white font-serif">
                    Indexing Legal Document for Citizen Explanation...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 py-2">
                  <div className="p-3 rounded-full bg-[#12203C] border border-[#2A3B5C]">
                    <UploadCloud className="w-7 h-7 text-[#C6A15B]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif">
                      Upload Any Court Order, Notice, or Legal Document
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Get a 5-part plain-language breakdown in everyday terms
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Active Document Info Bar */}
          {documentInfo && (
            <div className="bg-[#0B1528] p-4 rounded-xl border border-[#1B2A4A] flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#12203C] rounded-lg border border-[#2A3B5C]">
                  <FileSearch className="w-5 h-5 text-[#C6A15B]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-serif">{documentInfo.fileName}</h4>
                  <p className="text-[11px] text-slate-400">
                    {documentInfo.numPages} Pages · {documentInfo.totalChunks} Vector Chunks
                  </p>
                </div>
              </div>
              <button
                onClick={fetchPublicDocExplanation}
                disabled={isExplainingPublicDoc}
                className="px-4 py-2 bg-gradient-to-r from-[#E5C788] via-[#C6A15B] to-[#86682B] text-[#0B1528] font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md disabled:opacity-50"
              >
                {isExplainingPublicDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Explaining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Explain in Plain Language</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mandatory Prominent Disclaimer Banner */}
          <div className="p-4 bg-amber-950/70 border-l-4 border-amber-500 rounded-xl text-xs text-amber-200/90 flex items-start space-x-3 shadow-md">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-sans">
              <strong className="text-amber-300 font-bold uppercase tracking-wider block mb-0.5">
                Mandatory Citizen Notice
              </strong>
              This is general information to help you understand your document, <strong>NOT legal advice</strong>. Please consult a qualified lawyer or your nearest Legal Services Authority (NALSA Helpline: 15100) for guidance on your specific situation.
            </p>
          </div>

          {/* Explanation Loading */}
          {isExplainingPublicDoc && (
            <div className="py-12 text-center space-y-3 bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-8 shadow-xl">
              <Loader2 className="w-9 h-9 text-[#C6A15B] animate-spin mx-auto" />
              <p className="text-sm font-bold text-white font-serif">
                Generating Plain-Language Explanation...
              </p>
              <p className="text-xs text-slate-400">Removing legal jargon &amp; extracting key citizen steps</p>
            </div>
          )}

          {/* Explanation Error */}
          {publicExplainError && !isExplainingPublicDoc && (
            <div className="p-4 bg-rose-950/80 border-l-4 border-rose-500 rounded-xl text-xs text-rose-200 space-y-2">
              <p className="font-bold text-rose-100">Explanation Error</p>
              <p>{publicExplainError}</p>
              <button
                onClick={fetchPublicDocExplanation}
                className="px-3 py-1 bg-[#C6A15B] text-[#0B1528] font-bold rounded text-[11px]"
              >
                Retry Explanation
              </button>
            </div>
          )}

          {/* 5-Part Plain-Language Explanation Output Cards */}
          {publicExplanation && !isExplainingPublicDoc && (
            <div className="space-y-4">
              {/* 1. What is this document? */}
              <div className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-emerald-500 border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>1. What is this document?</span>
                </span>
                <p className="text-white font-serif text-sm leading-relaxed">
                  {publicExplanation.document_type}
                </p>
              </div>

              {/* 2. What happened / what does it say? */}
              <div className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-[#C6A15B] border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl">
                <span className="text-[#E5C788] font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>2. What happened / what does it say?</span>
                </span>
                <p className="text-slate-200 font-serif text-sm leading-relaxed whitespace-pre-line">
                  {publicExplanation.key_content}
                </p>
              </div>

              {/* 3. What does this mean for you? */}
              <div className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-sky-500 border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl">
                <span className="text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>3. What does this mean for you?</span>
                </span>
                <p className="text-slate-200 font-serif text-sm leading-relaxed whitespace-pre-line">
                  {publicExplanation.meaning}
                </p>
              </div>

              {/* 4. What should you do next? */}
              <div className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-purple-500 border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl">
                <span className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>4. What should you do next? (General Next Steps)</span>
                </span>
                <p className="text-slate-200 font-serif text-sm leading-relaxed whitespace-pre-line">
                  {publicExplanation.next_steps}
                </p>
              </div>

              {/* 5. Any deadlines? */}
              <div className="bg-[#0B1528] p-5 rounded-2xl border-l-4 border-amber-500 border-t border-r border-b border-[#1B2A4A] space-y-2 shadow-xl">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>5. Any deadlines or time limits?</span>
                </span>
                <p className="text-amber-200 font-serif font-bold text-sm leading-relaxed">
                  {publicExplanation.deadlines}
                </p>
              </div>
            </div>
          )}

          {!documentInfo && !publicExplanation && (
            <div className="py-8 text-center text-xs text-slate-400 bg-[#0B1528] rounded-2xl border border-[#1B2A4A] p-6">
              Upload a court notice, summons, or judgment PDF above to get an instant 5-part plain-language citizen explanation.
            </div>
          )}
        </div>
      )}

      {/* Free Legal Aid Section */}
      <FreeLegalHelpCard />
    </div>
  );
}
