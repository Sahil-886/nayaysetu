'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  ShieldCheck,
  FileSearch,
  ExternalLink,
  X,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Lock,
  Scale,
  Gavel,
  Sparkles,
} from 'lucide-react';

export interface CitationItem {
  chunk_index: number;
  snippet: string;
  similarity?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: CitationItem[];
  timestamp: string;
  isNotFound?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isAsking: boolean;
  onSendMessage: (question: string) => void;
  documentLoaded: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isAsking,
  onSendMessage,
  documentLoaded,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAsking) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  // Support Cmd+Enter / Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (inputQuery.trim() && !isAsking) {
        onSendMessage(inputQuery.trim());
        setInputQuery('');
      }
    }
  };

  const sampleQuestions = [
    'What is the core holding and ratio decidendi of this case?',
    'What constitutional provisions or fundamental rights were under review?',
    'What key legal test or guidelines did the court establish?',
  ];

  return (
    <div className="flex flex-col h-full bg-[#12203C] overflow-hidden relative p-4 space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A] shrink-0">
        <div className="flex items-center space-x-2.5 border-l-[3px] border-[#C6A15B] pl-3">
          <MessageSquare className="w-[18px] h-[18px] text-[#C6A15B]" />
          <h2 className="font-serif text-[17px] font-bold tracking-wide text-white">
            Grounded Q&A
          </h2>
        </div>
        <div
          className="flex items-center space-x-1.5 bg-[#2C7A4B]/90 text-white text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-md font-semibold"
          role="status"
          aria-label="Anti-hallucination guardrail is active"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
          <span>Anti-Hallucination Active</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" role="log" aria-label="Chat messages">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto animate-fade-in">
            {!documentLoaded ? (
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-2xl space-y-5 w-full card-hover">
                {/* Brass Diamond Logo Mark */}
                <div className="relative flex items-center justify-center w-14 h-14 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E5C788] via-[#C6A15B] to-[#86682B] rotate-45 rounded-lg shadow-md border border-[#F5E8C9]/40" />
                  <Scale className="relative w-7 h-7 text-[#0B1528] stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#0B1528] font-serif">
                    Welcome to NyaySetu
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto font-sans font-medium">
                    Upload a Supreme Court judgment to get an instant summary, grounded Q&amp;A with citations, and legally-relevant precedents — all processed on-device.
                  </p>
                </div>

                {/* 3 Feature Icons / Badges */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center space-y-1.5 transition-premium hover:border-[#C6A15B]/30 hover:bg-[#FAF4E8]/50">
                    <Sparkles className="w-4 h-4 text-[#C6A15B] mx-auto" />
                    <span className="text-[11px] font-bold text-[#0B1528] block font-serif">Summary</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Key Ratio &amp; Facts</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center space-y-1.5 transition-premium hover:border-[#C6A15B]/30 hover:bg-[#FAF4E8]/50">
                    <MessageSquare className="w-4 h-4 text-[#C6A15B] mx-auto" />
                    <span className="text-[11px] font-bold text-[#0B1528] block font-serif">Cited Q&amp;A</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Inline Sources</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center space-y-1.5 transition-premium hover:border-[#C6A15B]/30 hover:bg-[#FAF4E8]/50">
                    <Gavel className="w-4 h-4 text-[#C6A15B] mx-auto" />
                    <span className="text-[11px] font-bold text-[#0B1528] block font-serif">Precedent Match</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Statute Scoring</span>
                  </div>
                </div>

                {/* Privacy Badge */}
                <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 pt-1 font-medium">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>100% Private &amp; On-Device (Ollama llama3.2)</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl space-y-4 w-full">
                <div className="p-3 bg-[#FAF4E8] rounded-2xl w-fit mx-auto border border-[#C6A15B]/20">
                  <FileSearch className="w-7 h-7 text-[#C6A15B]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0B1528] font-serif">
                    Ready for Grounded Q&amp;A
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Ask any legal research question. Answers are strictly grounded in retrieved context chunks with inline citations.
                  </p>
                </div>

                {/* Sample Questions */}
                <div className="w-full space-y-2 pt-3 border-t border-slate-100 text-left">
                  <p className="text-[10px] font-bold text-[#86682B] uppercase tracking-wider">
                    Suggested Questions:
                  </p>
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className={`w-full text-left p-3 bg-slate-50 hover:bg-[#FAF4E8] border border-slate-100 hover:border-[#C6A15B]/40 rounded-lg text-xs text-[#0B1528] font-medium transition-premium flex items-center justify-between group animate-fade-in-up stagger-${idx + 1}`}
                    >
                      <span className="pr-2 leading-snug">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#C6A15B] shrink-0 transition-premium" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg, msgIdx) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}
            style={{ animationDelay: `${Math.min(msgIdx * 0.05, 0.3)}s` }}
          >
            <div
              className={`max-w-[85%] rounded-xl p-4 space-y-2.5 text-xs leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-[#0B1528] to-[#12203C] border border-[#2A3B5C] text-white rounded-br-sm'
                  : msg.isNotFound
                  ? 'bg-amber-50 border-l-[3px] border-amber-400 border-t border-r border-b border-amber-200 text-amber-900 rounded-bl-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
              }`}
            >
              {/* Not-Found Header */}
              {msg.sender === 'assistant' && msg.isNotFound && (
                <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-[11px] mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Information not found in document context</span>
                </div>
              )}

              <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs">{msg.text}</p>

              {/* Citation Pills */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100 mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] text-[#86682B] font-bold uppercase tracking-wider mr-0.5">
                    Sources:
                  </span>
                  {msg.citations.map((cit, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setActiveCitation(cit)}
                      className="cite-chip-hover px-2 py-0.5 bg-[#FAF4E8] text-[#86682B] border border-[#C6A15B]/40 rounded text-[10px] font-mono font-bold flex items-center space-x-1 group"
                      title="View source snippet"
                      aria-label={`View citation chunk ${cit.chunk_index}`}
                    >
                      <span>[Chunk {cit.chunk_index}]</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-[10px] block text-right mt-1 font-sans ${
                msg.sender === 'user' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Typing / Loading Indicator */}
        {isAsking && (
          <div className="flex items-start animate-fade-in-up">
            <div className="bg-white border border-slate-200 rounded-xl p-4 rounded-bl-sm flex items-center space-x-3 text-xs text-[#0B1528] shadow-lg">
              <div className="flex space-x-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <div>
                <span className="font-bold font-serif text-[11px]">Retrieving & generating...</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Anti-hallucination guardrail active</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citation Source Modal */}
      {activeCitation && (
        <div
          className="absolute inset-0 bg-[#0B1528]/80 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveCitation(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Citation source context"
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#FAF4E8] rounded-lg">
                  <FileSearch className="w-4 h-4 text-[#C6A15B]" />
                </div>
                <h4 className="font-bold text-sm text-[#0B1528] font-serif">
                  Source — Chunk {activeCitation.chunk_index}
                </h4>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#0B1528] transition-premium"
                aria-label="Close citation modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto font-serif text-xs leading-relaxed text-slate-700 scroll-light">
              {activeCitation.snippet}
            </div>

            {activeCitation.similarity !== undefined && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="font-bold text-slate-600">Cosine Similarity:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#2C7A4B] to-emerald-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.round(activeCitation.similarity * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[#2C7A4B] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {Math.round(activeCitation.similarity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 bg-white rounded-xl p-2 border border-slate-200 shadow-xl animate-fade-in-up"
      >
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 focus-within:border-[#C6A15B] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(198,161,91,0.1)] rounded-lg px-4 py-2.5 transition-premium">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!documentLoaded || isAsking}
            placeholder={
              documentLoaded
                ? 'Ask a legal research question...'
                : 'Upload a document first...'
            }
            className="flex-1 bg-transparent text-xs text-[#0B1528] placeholder-slate-400 focus:outline-none disabled:opacity-40 font-sans font-medium"
            aria-label="Legal research question input"
          />
          <span className="text-[9px] text-slate-300 hidden sm:inline font-mono">⌘↵</span>
          <button
            type="submit"
            disabled={!documentLoaded || !inputQuery.trim() || isAsking}
            className="p-2 bg-gradient-to-b from-[#D4B373] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#A4813A] disabled:opacity-30 disabled:cursor-not-allowed text-[#0B1528] font-bold rounded-lg transition-premium shadow-md flex items-center justify-center"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
