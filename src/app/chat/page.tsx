'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatPanel } from '@/components/ChatPanel';
import { useCaseContext } from '@/context/CaseContext';

export default function GroundedChatPage() {
  const {
    documentInfo,
    messages,
    isAsking,
    handleSendMessage,
  } = useCaseContext();

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A] shrink-0">
        <div>
          <h2 className="text-xl font-bold font-serif text-white tracking-wide">
            Grounded Case Q&amp;A Chat
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Ask questions grounded strictly in{' '}
            <span className="text-[#E5C788] font-semibold">{documentInfo?.fileName || 'loaded case'}</span> with paragraph &amp; page citations.
          </p>
        </div>
      </div>

      {/* Chat Panel Window */}
      <div className="flex-1 overflow-hidden bg-[#0B1528] rounded-2xl border border-[#1B2A4A] shadow-2xl">
        <ChatPanel
          messages={messages}
          isAsking={isAsking}
          onSendMessage={handleSendMessage}
          documentLoaded={Boolean(documentInfo)}
        />
      </div>
    </div>
  );
}
