'use client';

import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SuccessToast } from './SuccessToast';
import { useCaseContext } from '@/context/CaseContext';

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    documentInfo,
    summary,
    messages,
    precedents,
    ollamaStatus,
    fetchOllamaHealth,
    toastVisible,
    toastMessage,
    toastSubtext,
    dismissToast,
  } = useCaseContext();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#12203C]">
      {/* Toast Notification */}
      <SuccessToast
        message={toastMessage}
        subtext={toastSubtext}
        visible={toastVisible}
        onDismiss={dismissToast}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          ollamaStatus={ollamaStatus}
          onRefreshHealth={fetchOllamaHealth}
          fileName={documentInfo?.fileName}
          documentInfo={documentInfo}
          summary={summary}
          messages={messages}
          precedents={precedents}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#12203C] p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
