'use client';

import React, { useState } from 'react';
import {
  Send,
  User,
  Shield,
  BookOpen,
  FileText,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Scale,
  Sparkles,
  PhoneCall,
  X,
} from 'lucide-react';

export interface PublicCitation {
  id: string;
  title: string;
  statute: string;
  sections: string[];
  sourceFile: string;
  snippet: string;
  similarity: number;
}

export interface PublicChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: PublicCitation[];
  timestamp: string;
}

interface PublicChatPanelProps {
  messages: PublicChatMessage[];
  isAsking: boolean;
  onSendMessage: (question: string) => void;
}

const PRESET_TOPICS = [
  {
    icon: '🏠',
    title: 'Tenant & Eviction Rights',
    prompt: 'My landlord is threatening to evict me and lock me out without notice. What are my legal rights?',
  },
  {
    icon: '💼',
    title: 'Unpaid Salary / Wages',
    prompt: 'My employer has not paid my salary for the last 3 months. What legal steps can I take to recover my wages?',
  },
  {
    icon: '🛒',
    title: 'Defective Product & Consumer Refund',
    prompt: 'I purchased an expensive laptop that stopped working in 2 weeks. The seller refuses a refund or replacement.',
  },
  {
    icon: '📜',
    title: 'Right to Information (RTI)',
    prompt: 'How do I file an RTI application to check the status of my pending government scheme request?',
  },
  {
    icon: '🚨',
    title: 'FIR & Police Station Rights',
    prompt: 'What are my legal rights if police refuse to register an FIR for a theft, or call me for questioning?',
  },
  {
    icon: '🛡️',
    title: 'Domestic Violence & Safety',
    prompt: 'What emergency protection orders and helplines are available under the law for domestic abuse victims?',
  },
];

export const PublicChatPanel: React.FC<PublicChatPanelProps> = ({
  messages,
  isAsking,
  onSendMessage,
}) => {
  const [input, setInput] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<PublicCitation | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAsking) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleTopicClick = (prompt: string) => {
    if (!isAsking) {
      onSendMessage(prompt);
    }
  };

  // Helper to parse 4-section LLM response text into structured blocks
  const parseSections = (text: string) => {
    const rawSections = text.split(/(?=###\s*\d+\.\s*)/g);
    
    let rights = '';
    let law = '';
    let whatYouCanDo = '';
    let whereToGetHelp = '';

    for (const sec of rawSections) {
      if (sec.includes('Your Rights')) {
        rights = sec.replace(/###\s*\d+\.\s*Your Rights/i, '').trim();
      } else if (sec.includes('Applicable Law')) {
        law = sec.replace(/###\s*\d+\.\s*Applicable Law/i, '').trim();
      } else if (sec.includes('What You Can Do')) {
        whatYouCanDo = sec.replace(/###\s*\d+\.\s*What You Can Do/i, '').trim();
      } else if (sec.includes('Where to Get Help')) {
        whereToGetHelp = sec.replace(/###\s*\d+\.\s*Where to Get Help/i, '').trim();
      }
    }

    if (!rights && !law && !whatYouCanDo && !whereToGetHelp) {
      rights = text;
    }

    return { rights, law, whatYouCanDo, whereToGetHelp };
  };

  return (
    <div className="flex flex-col h-full bg-[#12203C] text-slate-100 overflow-hidden relative">
      {/* Statutory Context Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border-2 border-[#C6A15B]/60 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setSelectedCitation(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 text-[#E5C788] mb-3">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg">{selectedCitation.title}</h3>
            </div>
            <div className="text-xs text-[#C6A15B] font-mono mb-4 bg-[#12203C] px-3 py-1.5 rounded border border-[#2A3B5C]">
              Statute: {selectedCitation.statute} | Source File: {selectedCitation.sourceFile}
            </div>
            <div className="bg-[#12203C]/90 p-4 rounded-lg border border-slate-700 text-sm text-slate-300 leading-relaxed font-sans max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
              {selectedCitation.snippet}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 bg-[#C6A15B] text-[#0B1528] rounded-lg font-semibold text-xs hover:bg-[#E5C788] transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="bg-[#0B1528]/95 border-b border-[#C6A15B]/30 p-3.5 px-6 shrink-0 flex items-center space-x-3 text-amber-200/90 text-xs">
        <AlertTriangle className="w-4 h-4 text-[#C6A15B] shrink-0" />
        <p className="font-sans leading-tight">
          <strong className="text-[#E5C788]">Know Your Rights Assistant:</strong> Grounded in Indian Acts & Constitution.
          <span className="text-slate-400 ml-1">
            General information only — NOT legal advice. In emergencies, contact NALSA Legal Aid Helpline (15100).
          </span>
        </p>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto py-4 space-y-6">
            {/* Hero Welcome Card */}
            <div className="bg-gradient-to-br from-[#0B1528] to-[#162746] rounded-2xl p-6 border-2 border-[#C6A15B]/40 shadow-2xl">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#C6A15B]/20 border border-[#C6A15B]/50 flex items-center justify-center text-[#E5C788]">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif text-white">Know Your Rights</h2>
                  <p className="text-xs text-slate-400">
                    Plain-language public legal guidance for Indian citizens
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
                Describe your situation in plain English (e.g., landlord disputes, unpaid salary, consumer complaints, police rights). NyaySetu will match your situation against Indian statutes and provide a grounded 4-part legal breakdown.
              </p>
            </div>

            {/* Quick Topic Chips */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A15B] mb-3 flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Common Citizen Situations (Click to Ask)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleTopicClick(topic.prompt)}
                    disabled={isAsking}
                    className="text-left p-3.5 rounded-xl bg-[#0B1528]/80 hover:bg-[#162746] border border-[#2A3B5C] hover:border-[#C6A15B]/60 transition group flex items-start space-x-3"
                  >
                    <span className="text-xl">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-[#E5C788] transition">
                        {topic.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{topic.prompt}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#C6A15B] shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="max-w-4xl mx-auto">
              {msg.sender === 'user' ? (
                <div className="flex items-start justify-end space-x-3">
                  <div className="bg-[#C6A15B]/20 border border-[#C6A15B]/40 text-slate-100 p-4 rounded-2xl max-w-2xl text-sm leading-relaxed shadow-md">
                    <p className="font-medium text-[#E5C788] text-[11px] uppercase tracking-wider mb-1">Your Situation</p>
                    {msg.text}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#C6A15B] text-[#0B1528] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#0B1528] border border-[#C6A15B] text-[#E5C788] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-4">
                    {/* Parse response into 4 distinct cards */}
                    {(() => {
                      const { rights, law, whatYouCanDo, whereToGetHelp } = parseSections(msg.text);
                      return (
                        <div className="bg-[#0B1528]/90 border border-[#2A3B5C] rounded-2xl p-5 space-y-4 shadow-xl text-slate-200">
                          {/* Section 1: Your Rights */}
                          {rights && (
                            <div className="bg-[#12203C]/80 border border-emerald-500/30 rounded-xl p-4">
                              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                                <Shield className="w-4 h-4" />
                                <span>1. Your Rights</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{rights}</p>
                            </div>
                          )}

                          {/* Section 2: Applicable Law */}
                          {law && (
                            <div className="bg-[#12203C]/80 border border-[#C6A15B]/30 rounded-xl p-4">
                              <div className="flex items-center space-x-2 text-[#E5C788] font-bold text-xs uppercase tracking-wider mb-2">
                                <BookOpen className="w-4 h-4" />
                                <span>2. Applicable Law</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{law}</p>
                            </div>
                          )}

                          {/* Section 3: What You Can Do */}
                          {whatYouCanDo && (
                            <div className="bg-[#12203C]/80 border border-sky-500/30 rounded-xl p-4">
                              <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-2">
                                <FileText className="w-4 h-4" />
                                <span>3. What You Can Do (General Next Steps)</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{whatYouCanDo}</p>
                            </div>
                          )}

                          {/* Section 4: Where to Get Help */}
                          {whereToGetHelp && (
                            <div className="bg-[#12203C]/80 border border-amber-500/30 rounded-xl p-4">
                              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                                <PhoneCall className="w-4 h-4" />
                                <span>4. Where to Get Help</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{whereToGetHelp}</p>
                            </div>
                          )}

                          {/* Citations Footer */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-3 border-t border-slate-700/60">
                              <p className="text-[11px] text-[#C6A15B] font-semibold mb-2 uppercase tracking-wider">
                                Statutory Sources Cited ({msg.citations.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {msg.citations.map((cit) => (
                                  <button
                                    key={cit.id}
                                    onClick={() => setSelectedCitation(cit)}
                                    className="flex items-center space-x-1.5 px-3 py-1 bg-[#12203C] hover:bg-[#1B2A4A] border border-[#C6A15B]/40 hover:border-[#C6A15B] rounded-lg text-xs text-[#E5C788] transition"
                                  >
                                    <BookOpen className="w-3 h-3 text-[#C6A15B]" />
                                    <span className="font-medium truncate max-w-[200px]">{cit.title}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Message Disclaimer */}
                          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200/90 leading-tight">
                            ⚠️ <strong>Disclaimer:</strong> General legal information based on Indian statutes. Not legal advice. Consult a lawyer or dial NALSA Helpline (15100) for specific legal counsel.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isAsking && (
          <div className="max-w-4xl mx-auto flex items-center space-x-3 bg-[#0B1528]/80 p-4 rounded-xl border border-[#C6A15B]/40 animate-pulse text-xs text-[#E5C788]">
            <Scale className="w-5 h-5 animate-spin text-[#C6A15B]" />
            <span>Searching statutory rights corpus and generating grounded guidance...</span>
          </div>
        )}
      </div>

      {/* Bottom Input Form */}
      <div className="bg-[#0B1528] border-t border-[#C6A15B]/40 p-4 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your legal situation (e.g. landlord eviction, unpaid salary, defective product)..."
            disabled={isAsking}
            className="flex-1 bg-[#12203C] text-slate-100 placeholder-slate-400 px-4 py-3 rounded-xl border border-[#2A3B5C] focus:border-[#C6A15B] focus:outline-none text-xs md:text-sm font-sans"
          />
          <button
            type="submit"
            disabled={isAsking || !input.trim()}
            className="px-5 py-3 bg-gradient-to-r from-[#E5C788] via-[#C6A15B] to-[#86682B] text-[#0B1528] font-bold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 hover:opacity-95 transition disabled:opacity-50"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
