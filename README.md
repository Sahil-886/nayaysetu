# ⚖️ NyaySetu - Local AI Legal RAG Assistant

**NyaySetu** is a 100% local, privacy-first legal assistant built with Next.js 15, local Ollama models (`llama3.2` + `nomic-embed-text`), and Supabase Postgres with `pgvector` (or zero-config local vector stores).

It features **two independent workspaces**:
1. **⚖️ Legal Research (Judges & Lawyers)**: 3-panel workspace for PDF case upload, auto-summarization, grounded Q&A with inline chunk citations, and Supreme Court precedent matching.
2. **📢 Know Your Rights (Public)**: Plain-language legal guidance for citizens grounded in Indian statutes and the Constitution of India, providing 4-part structured responses with legal aid helpline citations.

---

## 🔒 Architecture & Privacy

NyaySetu is engineered specifically for sensitive legal workloads where data confidentiality is paramount.

- **100% On-Device AI Execution**: All document text extraction, vector embeddings, and LLM inference run strictly via your local Ollama daemon on your machine.
- **Zero External API Calls**: No data, embeddings, or prompts are ever transmitted to OpenAI, Anthropic, Google, or any external cloud AI provider.
- **Strict Data Isolation**: Legal research and public citizen inquiries run against separate vector corpora with strict safety guardrails and anti-hallucination bounds.

---

## 🛠️ Stack & Prerequisites

### Technology Stack
- **Frontend & App Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Local AI Engine**: [Ollama](https://ollama.com) (Free & Open Source)
- **Local LLM**: `llama3.2` (3B parameters, optimized for local inference)
- **Local Vector Embeddings**: `nomic-embed-text` (768 dimensions)
- **Vector Database**: Supabase Postgres + `pgvector` extension (with automated zero-config local vector store fallbacks)

### System Prerequisites
1. **Node.js**: `v18.0.0` or higher ([download node.js](https://nodejs.org))
2. **Ollama**: Free local AI daemon ([download from ollama.com](https://ollama.com))

---

## 🚀 Quick Start (Step-by-Step Setup)

### Step 1: Install & Pull Ollama Models

Install [Ollama](https://ollama.com) on your operating system. Open your terminal and run:

```bash
# Pull the local LLM model (llama3.2)
ollama pull llama3.2

# Pull the local embedding model (nomic-embed-text)
ollama pull nomic-embed-text
```

Verify local Ollama status:
```bash
curl http://127.0.0.1:11434/api/tags
```

---

### Step 2: Clone Repository & Install Dependencies

```bash
cd nyaysetu
npm install
```

---

### Step 3: Environment Setup

Create a `.env.local` file by copying the template:

```bash
cp .env.example .env.local
```

Default contents of `.env.local`:
```env
# Optional Supabase Credentials (leave default for instant local evaluation)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Local Ollama Configuration (Default localhost daemon)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_LLM_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_TIMEOUT_MS=120000
```

---

### Step 4: Vector Corpora Ingestion

NyaySetu maintains two separate pre-indexed vector corpora for full safety isolation:

1. **Ingest Judge/Lawyer Supreme Court Judgment Corpus**:
   ```bash
   npm run ingest
   ```
   *(Parses PDFs in `data/judgments/` and generates `data/corpus-index.json`)*.

2. **Ingest Public Citizen Rights & Statutes Corpus**:
   ```bash
   npm run ingest:public
   ```
   *(Parses PDFs in `data/public_corpus/` and generates `data/public-index.json`)*.

---

### Step 5: Launch Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧭 Interface Modes Guide

Use the segment toggle in the top header bar to switch between the two modes:

### Mode 1: ⚖️ Legal Research (Judges & Lawyers)
- **Document Panel**: Upload Supreme Court judgment PDFs and trigger auto-summarization.
- **Center Chat**: Ask grounded questions with interactive `[Chunk Y]` source citation drawers.
- **Precedents Panel**: Search Supreme Court precedent matches with 1-line AI similarity explanations.

### Mode 2: 📢 Know Your Rights (Public)
- **Plain-Language Citizen Queries**: Ask about tenant evictions, unpaid salaries, consumer refunds, RTI filings, FIR rights, or domestic violence protection.
- **Grounded 4-Part Responses**:
  1. **Your Rights**: Relevant rights under Indian law.
  2. **Applicable Law**: Acts and section numbers.
  3. **What You Can Do**: General administrative & procedural next steps.
  4. **Where to Get Help**: Official helplines (NALSA 15100, Consumer 1915, Women 181) and legal aid services.
- **Safety & Disclaimers**: Prominent non-legal-advice disclaimers and strict anti-hallucination bounds.

---

## 📄 License

NyaySetu is free and open-source software under the MIT License.
