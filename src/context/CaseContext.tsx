'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SummaryData, JudicialChecklistData } from '@/components/DocumentPanel';
import { ChatMessage } from '@/components/ChatPanel';
import { PrecedentItem } from '@/components/PrecedentsPanel';
import { PublicChatMessage } from '@/components/PublicChatPanel';
import { GraphData } from '@/components/RelationshipGraph';

export interface DocumentInfo {
  fileName: string;
  numPages: number;
  totalChunks: number;
  documentId: string;
  ocrUsed?: boolean;
}

export interface OllamaStatus {
  online: boolean;
  models: string[];
  hasLlmModel: boolean;
  hasEmbedModel: boolean;
  error?: string;
}

interface CaseContextType {
  sessionId: string;
  documentInfo: DocumentInfo | null;
  summary: SummaryData | null;
  judicialChecklist: JudicialChecklistData | null;
  summaryError: string | null;
  graphData: GraphData | null;
  isGeneratingGraph: boolean;
  graphError: string | null;
  messages: ChatMessage[];
  precedents: PrecedentItem[];
  publicMessages: PublicChatMessage[];
  ollamaStatus: OllamaStatus | null;
  isIngesting: boolean;
  isSummarizing: boolean;
  isAsking: boolean;
  isAskingPublic: boolean;
  isSearchingPrecedents: boolean;
  error: string | null;
  toastVisible: boolean;
  toastMessage: string;
  toastSubtext: string;
  dismissToast: () => void;
  fetchOllamaHealth: () => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handleGenerateSummary: () => void;
  fetchGraph: () => Promise<void>;
  handleSendMessage: (questionText: string) => Promise<void>;
  handleSendPublicMessage: (questionText: string) => Promise<void>;
  handleSearchPrecedents: () => Promise<void>;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);

  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [judicialChecklist, setJudicialChecklist] = useState<JudicialChecklistData | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [precedents, setPrecedents] = useState<PrecedentItem[]>([]);
  const [publicMessages, setPublicMessages] = useState<PublicChatMessage[]>([]);

  const [isIngesting, setIsIngesting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isAskingPublic, setIsAskingPublic] = useState(false);
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

  const fetchGraph = useCallback(async () => {
    if (!documentInfo || !sessionId) return;
    setIsGeneratingGraph(true);
    setGraphError(null);

    try {
      const res = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          documentId: documentInfo.documentId,
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
  }, [documentInfo, sessionId]);

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

      const docInfo: DocumentInfo = {
        fileName: data.fileName,
        numPages: data.numPages,
        totalChunks: data.totalChunks,
        documentId: data.documentId,
        ocrUsed: data.ocrUsed || false,
      };

      setDocumentInfo(docInfo);

      const ocrNote = data.ocrUsed ? ' (OCR extracted)' : '';
      setToastMessage(`"${data.fileName}" indexed successfully${ocrNote}`);
      setToastSubtext(`${data.totalChunks} vector chunks · ${data.numPages} pages${data.ocrUsed ? ' · Scanned document' : ''}`);
      setToastVisible(true);

      const ocrGreeting = data.ocrUsed
        ? `Scanned document "${data.fileName}" processed via on-device OCR and indexed into local vector store (${data.totalChunks} vector chunks). Auto-summarization has been triggered.`
        : `Document "${data.fileName}" successfully indexed into local vector store (${data.totalChunks} vector chunks). Auto-summarization has been triggered.`;

      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: ocrGreeting,
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

  const handleGenerateSummary = () => {
    if (documentInfo) {
      fetchSummary(documentInfo.documentId, sessionId);
    }
  };

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
    <CaseContext.Provider
      value={{
        sessionId,
        documentInfo,
        summary,
        judicialChecklist,
        summaryError,
        graphData,
        isGeneratingGraph,
        graphError,
        messages,
        precedents,
        publicMessages,
        ollamaStatus,
        isIngesting,
        isSummarizing,
        isAsking,
        isAskingPublic,
        isSearchingPrecedents,
        error,
        toastVisible,
        toastMessage,
        toastSubtext,
        dismissToast: () => setToastVisible(false),
        fetchOllamaHealth,
        handleFileUpload,
        handleGenerateSummary,
        fetchGraph,
        handleSendMessage,
        handleSendPublicMessage,
        handleSearchPrecedents,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCaseContext = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCaseContext must be used within a CaseProvider');
  }
  return context;
};
