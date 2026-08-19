'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DocumentPanel } from '@/components/DocumentPanel';
import { ChatPanel, ChatMessage } from '@/components/ChatPanel';
import { PrecedentsPanel, PrecedentItem } from '@/components/PrecedentsPanel';
import { PublicChatPanel, PublicChatMessage } from '@/components/PublicChatPanel';
import { SuccessToast } from '@/components/SuccessToast';

export default function Home() {
  const [viewMode, setViewMode] = useState<'research' | 'public'>('research');
  const [sessionId, setSessionId] = useState<string>('');
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);

  // Document state (Research Mode)
  const [documentInfo, setDocumentInfo] = useState<{
    fileName: string;
    numPages: number;
    totalChunks: number;
    documentId: string;
  } | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [judicialChecklist, setJudicialChecklist] = useState<any>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [precedents, setPrecedents] = useState<PrecedentItem[]>([]);

  // Public Mode Chat State
  const [publicMessages, setPublicMessages] = useState<PublicChatMessage[]>([]);
  const [isAskingPublic, setIsAskingPublic] = useState(false);

  // Loading states
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isSearchingPrecedents, setIsSearchingPrecedents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');

  // Initialize Session ID on mount
  useEffect(() => {
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    fetchOllamaHealth();
  }, []);

  const fetchOllamaHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setOllamaStatus(data);
    } catch (err: any) {
      setOllamaStatus({
        online: false,
        hasLlmModel: false,
        hasEmbedModel: false,
        models: [],
        error: 'Failed to contact local health API',
      });
    }
  }, []);

  // Fetch summary helper
  const fetchSummary = useCallback(async (docId: string, sessId: string) => {
    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          documentId: docId,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (parseErr) {
          throw new Error('Analysis generation returned invalid response format. Click Re-Analyze to retry.');
        }
      } else {
        const text = await res.text();
        console.error('[Auto Summary Error]: Non-JSON server response:', text.slice(0, 200));
        throw new Error('Analysis request encountered a server error. Click Re-Analyze to retry.');
      }

      if (!res.ok || !data || !data.success) {
        throw new Error(data?.error || 'Failed to generate document summary. Click Re-Analyze to retry.');
      }

      setSummary(data.summary);
      setJudicialChecklist(data.judicialChecklist || null);
    } catch (err: any) {
      console.error('[Auto Summary Error]:', err);
      const cleanMsg =
        err.message?.includes('Unexpected token') || err.message?.includes('<!DOCTYPE')
          ? 'Analysis generation failed — click Re-Analyze to retry.'
          : err.message || 'Analysis generation failed — click Re-Analyze to retry.';
      setSummaryError(cleanMsg);
    } finally {
      setIsSummarizing(false);
    }
  }, []);

  // Fetch Legal Relationship Graph helper
  const fetchGraph = useCallback(async (docId: string, sessId: string) => {
    setIsGeneratingGraph(true);
    setGraphError(null);

    try {
      const res = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          documentId: docId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data || !data.success) {
        throw new Error(data?.error || 'Failed to extract legal relationship graph.');
      }

      setGraphData(data.graph);
    } catch (err: any) {
      console.error('[Fetch Graph Error]:', err);
      setGraphError(err.message || 'Failed to extract relationship graph.');
    } finally {
      setIsGeneratingGraph(false);
    }
  }, []);

  // Handle PDF Upload
  const handleFileUpload = async (file: File) => {
    setIsIngesting(true);
    setError(null);
    setSummary(null);
    setJudicialChecklist(null);
    setSummaryError(null);
    setGraphData(null);
    setGraphError(null);
    setPrecedents([]);
    setMessages([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest PDF');
      }

      const docInfo = {
        fileName: data.fileName,
        numPages: data.numPages,
        totalChunks: data.totalChunks,
        documentId: data.documentId,
      };

      setDocumentInfo(docInfo);

      // Show success toast
      setToastMessage(`"${data.fileName}" indexed successfully`);
      setToastSubtext(`${data.totalChunks} vector chunks · ${data.numPages} pages`);
      setToastVisible(true);

      // Add system greeting message
      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `Document "${data.fileName}" successfully indexed into local vector store (${data.totalChunks} vector chunks). Auto-summarization has been triggered.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      fetchSummary(data.documentId, sessionId);
    } catch (err: any) {
      setError(err.message || 'Error parsing and ingesting PDF document');
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle Auto-Summary Retry / Manual Trigger
  const handleGenerateSummary = () => {
    if (documentInfo) {
      fetchSummary(documentInfo.documentId, sessionId);
    }
  };

  // Handle Grounded Question Submission (Research Mode)
  const handleSendMessage = async (questionText: string) => {
    if (!documentInfo || !questionText.trim()) return;

    const userMsgId = `msg-u-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAsking(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          sessionId,
          documentId: documentInfo.documentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const assistantMsg: ChatMessage = {
        id: `msg-a-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        citations: data.citations,
        isNotFound: !data.found,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `Error during inference: ${err.message}`,
        isNotFound: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  // Handle Grounded Question Submission (Public Mode)
  const handleSendPublicMessage = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: PublicChatMessage = {
      id: `pub-u-${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setPublicMessages((prev) => [...prev, userMsg]);
    setIsAskingPublic(true);

    try {
      const res = await fetch('/api/public-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate public guidance');
      }

      const assistantMsg: PublicChatMessage = {
        id: `pub-a-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        citations: data.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setPublicMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: PublicChatMessage = {
        id: `pub-err-${Date.now()}`,
        sender: 'assistant',
        text: `Error retrieving public legal information: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setPublicMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAskingPublic(false);
    }
  };

  // Handle Precedent Search
  const handleSearchPrecedents = async () => {
    if (!documentInfo) return;
    setIsSearchingPrecedents(true);

    try {
      const res = await fetch('/api/precedents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          documentId: documentInfo.documentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to find precedents');
      }

      setPrecedents(data.precedents || []);
    } catch (err: any) {
      setError(err.message || 'Error conducting precedent search');
    } finally {
      setIsSearchingPrecedents(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#12203C]">
      {/* Success Toast */}
      <SuccessToast
        message={toastMessage}
        subtext={toastSubtext}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
      {/* Top Header */}
      <Header
        ollamaStatus={ollamaStatus}
        onRefreshHealth={fetchOllamaHealth}
        fileName={documentInfo?.fileName}
        documentInfo={documentInfo}
        summary={summary}
        messages={messages}
        precedents={precedents}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Conditional Workspace Rendering */}
      {viewMode === 'public' ? (
        <div className="flex-1 overflow-hidden">
          <PublicChatPanel
            messages={publicMessages}
            isAsking={isAskingPublic}
            onSendMessage={handleSendPublicMessage}
          />
        </div>
      ) : (
        /* Main Three-Panel Workspace for Judges & Lawyers */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Panel: Upload, Document Details, Summary, Timeline (3 cols = 25%) */}
          <div className="md:col-span-3 h-full overflow-hidden">
            <DocumentPanel
              documentInfo={documentInfo}
              summary={summary}
              judicialChecklist={judicialChecklist}
              summaryError={summaryError}
              graphData={graphData}
              isGeneratingGraph={isGeneratingGraph}
              graphError={graphError}
              isIngesting={isIngesting}
              isSummarizing={isSummarizing}
              onFileUpload={handleFileUpload}
              onGenerateSummary={handleGenerateSummary}
              onFetchGraph={() => documentInfo && fetchGraph(documentInfo.documentId, sessionId)}
              error={error}
            />
          </div>

          {/* Center Panel: Grounded Q&A Chat & Citations (6 cols = 50%) */}
          <div className="md:col-span-6 h-full overflow-hidden">
            <ChatPanel
              messages={messages}
              isAsking={isAsking}
              onSendMessage={handleSendMessage}
              documentLoaded={Boolean(documentInfo)}
            />
          </div>

          {/* Right Panel: Precedent Similarity Matches (3 cols = 25%) */}
          <div className="md:col-span-3 h-full overflow-hidden">
            <PrecedentsPanel
              precedents={precedents}
              isSearching={isSearchingPrecedents}
              onSearchPrecedents={handleSearchPrecedents}
              documentLoaded={Boolean(documentInfo)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

