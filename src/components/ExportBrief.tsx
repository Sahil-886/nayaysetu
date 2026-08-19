'use client';

import React from 'react';
import { FileDown } from 'lucide-react';
import { ChatMessage } from './ChatPanel';
import { PrecedentItem } from './PrecedentsPanel';

interface ExportBriefProps {
  documentInfo: {
    fileName: string;
    numPages: number;
    totalChunks: number;
    documentId: string;
  } | null;
  summary: any;
  messages: ChatMessage[];
  precedents: PrecedentItem[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}

function buildBriefHtml(
  documentInfo: ExportBriefProps['documentInfo'],
  summary: any,
  messages: ChatMessage[],
  precedents: PrecedentItem[]
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const caseName = documentInfo?.fileName?.replace(/\.pdf$/i, '').replace(/_/g, ' ') || 'Untitled Case';

  // --- Summary Section ---
  let summaryHtml = '';
  if (summary) {
    const fields = [
      { label: 'Parties', value: summary.parties },
      { label: 'Core Issue', value: summary.coreIssue || summary.core_issue },
      { label: 'Key Facts', value: summary.keyFacts || summary.key_facts },
      { label: 'Holding / Ratio Decidendi', value: summary.holding },
    ];
    summaryHtml = `
      <section class="section">
        <h2>Structured Case Summary</h2>
        <table class="summary-table">
          ${fields
            .map(
              (f) => `
            <tr>
              <td class="label">${escapeHtml(f.label)}</td>
              <td class="value">${f.value ? escapeHtml(String(f.value)) : '<em class="not-stated">Not stated in document</em>'}</td>
            </tr>`
            )
            .join('')}
        </table>
      </section>`;
  }

  // --- Q&A History Section ---
  const qaMessages = messages.filter((m) => m.sender === 'user' || (m.sender === 'assistant' && m.text));
  let qaHtml = '';
  if (qaMessages.length > 0) {
    // Pair user questions with assistant answers
    const pairs: Array<{ question: string; answer: string; citations: string[]; isNotFound: boolean }> = [];
    for (let i = 0; i < qaMessages.length; i++) {
      const msg = qaMessages[i];
      if (msg.sender === 'user') {
        const next = qaMessages[i + 1];
        const answer = next && next.sender === 'assistant' ? next.text : '';
        const citations =
          next && next.citations
            ? next.citations.map((c) => `Chunk ${c.chunk_index}${c.similarity !== undefined ? ` (${Math.round(c.similarity * 100)}%)` : ''}`)
            : [];
        pairs.push({
          question: msg.text,
          answer,
          citations,
          isNotFound: next?.isNotFound || false,
        });
      }
    }

    if (pairs.length > 0) {
      qaHtml = `
        <section class="section">
          <h2>Grounded Q&amp;A Session</h2>
          ${pairs
            .map(
              (p, idx) => `
            <div class="qa-pair">
              <div class="question"><span class="q-label">Q${idx + 1}.</span> ${escapeHtml(p.question)}</div>
              <div class="answer ${p.isNotFound ? 'not-found' : ''}">
                <span class="a-label">${p.isNotFound ? '⚠ Not Found:' : 'A.'}</span> ${escapeHtml(p.answer)}
                ${
                  p.citations.length > 0
                    ? `<div class="citations">Sources: ${p.citations.map((c) => `<span class="cite-chip">${escapeHtml(c)}</span>`).join(' ')}</div>`
                    : ''
                }
              </div>
            </div>`
            )
            .join('')}
        </section>`;
    }
  }

  // --- Precedents Section ---
  let precedentsHtml = '';
  if (precedents.length > 0) {
    precedentsHtml = `
      <section class="section">
        <h2>Similar Precedents</h2>
        <table class="precedent-table">
          <thead>
            <tr>
              <th style="width:40%">Case Name</th>
              <th style="width:12%">Year</th>
              <th style="width:12%">Match</th>
              <th style="width:36%">Reason for Match</th>
            </tr>
          </thead>
          <tbody>
            ${precedents
              .map(
                (p) => `
              <tr>
                <td>
                  <strong>${escapeHtml(p.case_name)}</strong>
                  <div class="court-line">${escapeHtml(p.court)}</div>
                  ${
                    p.shared_statutes && p.shared_statutes.length > 0
                      ? `<div class="shared-statutes">${p.shared_statutes.map((s) => `<span class="statute-chip">${escapeHtml(s)}</span>`).join(' ')}</div>`
                      : ''
                  }
                </td>
                <td class="center">${p.year}</td>
                <td class="center">
                  <span class="match-score ${p.similarity >= 70 ? 'high' : p.similarity >= 40 ? 'medium' : 'low'}">${p.similarity}%</span>
                </td>
                <td class="reason">${escapeHtml(p.why_similar)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NyaySetu Legal Research Brief — ${escapeHtml(caseName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

    :root {
      --navy-dark: #0B1528;
      --navy: #1B2A4A;
      --navy-light: #12203C;
      --brass: #C6A15B;
      --brass-light: #E5C788;
      --brass-bg: #FAF4E8;
      --ink: #20293A;
      --muted: #5B6472;
      --surface: #FFFFFF;
      --bg: #F7F8FA;
      --green: #2C7A4B;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 11px;
      line-height: 1.6;
      color: var(--ink);
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ---- Header ---- */
    .brief-header {
      background: var(--navy-dark);
      color: white;
      padding: 24px 32px;
      margin: -18mm -16mm 0 -16mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid var(--brass);
    }
    @media screen {
      .brief-header {
        margin: 0;
        border-radius: 0;
      }
    }
    .brief-header .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brief-header .diamond {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--brass-light), var(--brass), #86682B);
      transform: rotate(45deg);
      border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
    }
    .brief-header .diamond svg {
      transform: rotate(-45deg);
      width: 18px; height: 18px;
      fill: none; stroke: var(--navy-dark); stroke-width: 2.5;
    }
    .brief-header .title-block h1 {
      font-family: 'Source Serif 4', Georgia, Cambria, serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .brief-header .title-block .subtitle {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .brief-header .meta-right {
      text-align: right;
      font-size: 10px;
      color: #94a3b8;
    }
    .brief-header .meta-right .date { color: var(--brass-light); font-weight: 600; }

    /* ---- Case Banner ---- */
    .case-banner {
      background: var(--bg);
      border: 1px solid #e2e5ea;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 24px 0 8px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .case-banner .case-name {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--navy);
    }
    .case-banner .badge {
      background: var(--brass-bg);
      color: #86682B;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid rgba(198,161,91,0.3);
    }

    /* ---- Section ---- */
    .section {
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .section h2 {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--navy);
      padding-bottom: 8px;
      margin-bottom: 12px;
      border-bottom: 2px solid var(--brass);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section h2::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: var(--brass);
      border-radius: 2px;
    }

    /* ---- Summary Table ---- */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-table tr { border-bottom: 1px solid #eee; }
    .summary-table tr:last-child { border-bottom: none; }
    .summary-table td { padding: 10px 12px; vertical-align: top; }
    .summary-table .label {
      width: 160px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--brass);
      background: var(--brass-bg);
      border-right: 2px solid var(--brass);
    }
    .summary-table .value {
      font-size: 11px;
      color: var(--ink);
      line-height: 1.65;
    }
    .not-stated { color: #94a3b8; font-style: italic; }

    /* ---- Q&A ---- */
    .qa-pair {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .question {
      background: var(--navy-dark);
      color: white;
      padding: 10px 14px;
      border-radius: 8px 8px 8px 2px;
      font-size: 11px;
      font-weight: 600;
    }
    .q-label { color: var(--brass-light); font-weight: 700; margin-right: 6px; }
    .answer {
      background: var(--surface);
      border: 1px solid #e2e5ea;
      padding: 10px 14px;
      border-radius: 2px 8px 8px 8px;
      margin-top: 6px;
      font-size: 11px;
      line-height: 1.7;
    }
    .answer.not-found {
      background: #FFFBEB;
      border-color: #FDE68A;
      color: #92400E;
    }
    .a-label { font-weight: 700; color: var(--navy); margin-right: 4px; }
    .citations {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #eee;
      font-size: 9px;
      color: var(--muted);
      font-weight: 600;
    }
    .cite-chip {
      display: inline-block;
      background: var(--brass-bg);
      color: #86682B;
      padding: 2px 8px;
      border-radius: 4px;
      margin: 2px 4px 2px 0;
      font-family: 'SFMono-Regular', 'Consolas', monospace;
      font-size: 9px;
      font-weight: 700;
      border: 1px solid rgba(198,161,91,0.3);
    }

    /* ---- Precedent Table ---- */
    .precedent-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .precedent-table thead th {
      background: var(--navy);
      color: var(--brass-light);
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 8px 10px;
      text-align: left;
    }
    .precedent-table thead th.center,
    .precedent-table tbody td.center { text-align: center; }
    .precedent-table tbody tr { border-bottom: 1px solid #eee; }
    .precedent-table tbody tr:nth-child(even) { background: #FAFBFC; }
    .precedent-table tbody td { padding: 10px; vertical-align: top; }
    .court-line { font-size: 9px; color: var(--muted); margin-top: 2px; }
    .shared-statutes { margin-top: 4px; }
    .statute-chip {
      display: inline-block;
      background: #ECFDF5;
      color: #065F46;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8.5px;
      font-weight: 600;
      margin: 1px 3px 1px 0;
      border: 1px solid #A7F3D0;
    }
    .match-score {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-family: 'SFMono-Regular', monospace;
      font-size: 11px;
    }
    .match-score.high { background: #ECFDF5; color: #065F46; }
    .match-score.medium { background: var(--brass-bg); color: #86682B; }
    .match-score.low { background: #F1F5F9; color: #475569; }
    .reason { font-size: 10px; color: var(--ink); line-height: 1.55; }

    /* ---- Footer ---- */
    .brief-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e5ea;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--muted);
      font-size: 9px;
    }
    .brief-footer .disclaimer {
      max-width: 70%;
      line-height: 1.5;
    }
    .brief-footer .gen-mark {
      color: var(--brass);
      font-weight: 700;
      font-size: 10px;
    }

    /* ---- Print tweaks ---- */
    @media print {
      body { font-size: 10.5px; }
      .no-print { display: none !important; }
      .brief-header { margin: -18mm -16mm 0 -16mm; }
    }
    @media screen {
      body { max-width: 850px; margin: 0 auto; padding: 0 0 40px 0; background: #F1F5F9; }
      .brief-header { margin: 0; }
      .page-content { padding: 0 32px; }
    }
  </style>
</head>
<body>
  <!-- Print button (screen only) -->
  <div class="no-print" style="background:var(--navy-dark);text-align:center;padding:12px;">
    <button onclick="window.print()" style="background:linear-gradient(to bottom,#D4B373,#C6A15B);color:#0B1528;border:none;padding:10px 28px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:Inter,sans-serif;">
      ⬇ Print / Save as PDF
    </button>
  </div>

  <header class="brief-header">
    <div class="brand">
      <div class="diamond">
        <svg viewBox="0 0 24 24"><path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="title-block">
        <h1>NyaySetu Legal Research Brief</h1>
        <div class="subtitle">On-Device AI Legal Research Assistant</div>
      </div>
    </div>
    <div class="meta-right">
      <div class="date">${escapeHtml(dateStr)}</div>
      <div>${escapeHtml(timeStr)}</div>
    </div>
  </header>

  <div class="page-content">
    <div class="case-banner">
      <div class="case-name">${escapeHtml(caseName)}</div>
      <div class="badge">Research Brief</div>
    </div>

    ${summaryHtml}
    ${qaHtml}
    ${precedentsHtml}

    ${!summary && qaMessages.length === 0 && precedents.length === 0
      ? '<section class="section"><p style="color:#94a3b8;text-align:center;padding:40px 0;font-style:italic;">No research data generated yet for this case. Complete the summary, Q&amp;A, or precedent search to populate this brief.</p></section>'
      : ''
    }

    <footer class="brief-footer">
      <div class="disclaimer">
        Generated by NyaySetu — On-device AI legal research. AI-assisted; not legal advice.
        All inference performed locally via Ollama (llama3.2 + nomic-embed-text). No data leaves your device.
      </div>
      <div class="gen-mark">NyaySetu</div>
    </footer>
  </div>
</body>
</html>`;
}

export const ExportBriefButton: React.FC<ExportBriefProps> = ({
  documentInfo,
  summary,
  messages,
  precedents,
}) => {
  const isDisabled = !documentInfo;

  const handleExport = () => {
    if (!documentInfo) return;

    const html = buildBriefHtml(documentInfo, summary, messages, precedents);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to export the brief.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handleExport}
      disabled={isDisabled}
      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-premium shadow-md ${
        isDisabled
          ? 'bg-[#1B2A4A]/60 text-slate-500 cursor-not-allowed border border-[#2A3B5C]/40'
          : 'bg-gradient-to-b from-[#D4B373] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#A4813A] text-[#0B1528] border border-[#C6A15B]/50'
      }`}
      title={isDisabled ? 'Upload a case first' : 'Export a printable research brief for this case'}
      aria-label={isDisabled ? 'Export Brief — Upload a case first' : 'Export Research Brief'}
    >
      <FileDown className="w-3.5 h-3.5" />
      <span>Export Brief</span>
    </button>
  );
};
