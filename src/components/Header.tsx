'use client';

import React from 'react';
import { Scale, Server, RefreshCw, FileText, Shield, Wifi, WifiOff } from 'lucide-react';
import { ExportBriefButton } from './ExportBrief';
import { ChatMessage } from './ChatPanel';
import { PrecedentItem } from './PrecedentsPanel';

interface HeaderProps {
  ollamaStatus: {
    online: boolean;
    hasLlmModel: boolean;
    hasEmbedModel: boolean;
    models: string[];
    error?: string;
  } | null;
  onRefreshHealth: () => void;
  fileName?: string;
  documentInfo?: {
    fileName: string;
    numPages: number;
    totalChunks: number;
    documentId: string;
  } | null;
  summary?: any;
  messages?: ChatMessage[];
  precedents?: PrecedentItem[];
  viewMode?: 'research' | 'public';
  onToggleViewMode?: (mode: 'research' | 'public') => void;
}

export const Header: React.FC<HeaderProps> = ({
  ollamaStatus,
  onRefreshHealth,
  fileName,
  documentInfo,
  summary,
  messages = [],
  precedents = [],
  viewMode = 'research',
  onToggleViewMode,
}) => {
  return (
    <header
      className="bg-[#0B1528] border-b-2 border-[#C6A15B]/70 text-white px-6 py-3 flex items-center justify-between shadow-2xl shrink-0 z-20 relative"
      role="banner"
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528] via-[#0F1A30] to-[#0B1528] pointer-events-none" />

      {/* Brand Logo & Tagline */}
      <div className="flex items-center space-x-4 relative z-10">
        {/* Brass Diamond Logo Mark */}
        <div className="relative flex items-center justify-center w-10 h-10 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E5C788] via-[#C6A15B] to-[#86682B] rotate-45 rounded-[5px] shadow-lg border border-[#F5E8C9]/30" />
          <Scale className="relative w-5 h-5 text-[#0B1528] stroke-[2.5] drop-shadow-sm" />
        </div>

        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-[22px] font-bold tracking-[0.02em] text-white font-serif leading-none">
              NyaySetu
            </h1>
            <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase px-2.5 py-[3px] rounded-md bg-[#C6A15B]/15 text-[#E5C788] border border-[#C6A15B]/30">
              AI Legal Assistant
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans tracking-tight font-medium mt-1 flex items-center space-x-1.5">
            <span>Justice, Accelerated by AI</span>
            <span className="text-slate-600">—</span>
            <span className="text-slate-500">On-Device Legal Research</span>
          </p>
        </div>
      </div>

      {/* Mode Switcher Selector Segment */}
      <div className="flex items-center bg-[#12203C] p-1 rounded-xl border border-[#2A3B5C] relative z-10 shadow-inner">
        <button
          onClick={() => onToggleViewMode?.('research')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'research'
              ? 'bg-[#C6A15B] text-[#0B1528] shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1B2A4A]'
          }`}
        >
          <span>⚖️</span>
          <span>Legal Research (Judges & Lawyers)</span>
        </button>
        <button
          onClick={() => onToggleViewMode?.('public')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === 'public'
              ? 'bg-[#C6A15B] text-[#0B1528] shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1B2A4A]'
          }`}
        >
          <span>📢</span>
          <span>Know Your Rights (Public)</span>
        </button>
      </div>

      {/* Center: Active Document + Privacy Badge */}
      <div className="hidden lg:flex items-center space-x-4 relative z-10">
        {fileName && (
          <div className="flex items-center space-x-2.5 bg-[#12203C]/80 px-4 py-1.5 rounded-full border border-[#2A3B5C] text-xs animate-fade-in">
            <FileText className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
            <span className="font-medium text-slate-400">Active:</span>
            <span className="text-[#E5C788] font-semibold truncate max-w-[220px]" title={fileName}>
              {fileName}
            </span>
          </div>
        )}

        {/* Privacy / On-Device Badge */}
        <div className="flex items-center space-x-1.5 bg-[#12203C]/60 px-3 py-1.5 rounded-full border border-[#2A3B5C]/60 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">100% On-Device</span>
        </div>
      </div>

      {/* Right: Export Brief + Ollama Status Badge + Refresh */}
      <div className="flex items-center space-x-3 relative z-10">
        {/* Export Brief Button */}
        <ExportBriefButton
          documentInfo={documentInfo || null}
          summary={summary}
          messages={messages}
          precedents={precedents}
        />

        {ollamaStatus ? (
          <div className="flex items-center space-x-2">
            {ollamaStatus.online ? (
              <div
                className="status-pill-transition flex items-center space-x-2 bg-[#2C7A4B]/90 text-white text-[11px] px-3.5 py-1.5 rounded-full font-semibold shadow-lg border border-emerald-500/30 animate-fade-in"
                role="status"
                aria-label="Ollama is online"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-200" />
                <span>Ollama Active</span>
                <span className="text-emerald-200 text-[10px] hidden xl:inline font-mono opacity-80">
                  llama3.2
                </span>
              </div>
            ) : (
              <div
                className="status-pill-transition flex items-center space-x-2 bg-rose-900/80 text-white text-[11px] px-3.5 py-1.5 rounded-full font-semibold shadow-lg border border-rose-500/30 animate-fade-in"
                title={ollamaStatus.error}
                role="alert"
              >
                <WifiOff className="w-3.5 h-3.5 text-rose-300" />
                <span>Ollama Offline</span>
              </div>
            )}

            <button
              onClick={onRefreshHealth}
              className="p-2 hover:bg-[#1B2A4A] rounded-lg text-slate-400 hover:text-[#C6A15B] transition-premium border border-transparent hover:border-[#2A3B5C]"
              title="Refresh Connection Status"
              aria-label="Refresh Ollama connection status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium animate-fade-in">
            <Server className="w-3.5 h-3.5 animate-spin text-[#C6A15B]" />
            <span>Connecting to local daemon...</span>
          </div>
        )}
      </div>
    </header>
  );
};
