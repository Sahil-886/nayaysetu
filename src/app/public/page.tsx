'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { PublicChatPanel } from '@/components/PublicChatPanel';
import { useCaseContext } from '@/context/CaseContext';

export default function PublicKnowYourRightsPage() {
  const {
    publicMessages,
    isAskingPublic,
    handleSendPublicMessage,
  } = useCaseContext();

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2A4A] shrink-0">
        <div>
          <h2 className="text-xl font-bold font-serif text-white tracking-wide">
            Know Your Rights — Public Legal Information &amp; Guidance
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Simplified legal information for Indian citizens grounded in constitutional rights, RTI, consumer protection, and labor laws.
          </p>
        </div>
      </div>

      {/* Public Chat Window */}
      <div className="flex-1 overflow-hidden bg-[#0B1528] rounded-2xl border border-[#1B2A4A] shadow-2xl">
        <PublicChatPanel
          messages={publicMessages}
          isAsking={isAskingPublic}
          onSendMessage={handleSendPublicMessage}
        />
      </div>
    </div>
  );
}
