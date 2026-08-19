import type { Metadata } from 'next';
import './globals.css';
import { CaseProvider } from '@/context/CaseContext';
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'NyaySetu — AI Legal Research Assistant & Precedent Search',
  description:
    'On-device AI legal research assistant with grounded Q&A, strict citations, and Supreme Court precedent matching. Powered by Ollama — fully private, no cloud.',
  keywords: [
    'legal AI',
    'court judgment analysis',
    'precedent search',
    'RAG',
    'on-device AI',
    'Ollama',
    'NyaySetu',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#0B1528" />
      </head>
      <body className="h-full bg-[#12203C] text-[#20293A] antialiased font-sans flex flex-col overflow-hidden">
        <CaseProvider>
          <AppLayout>{children}</AppLayout>
        </CaseProvider>
      </body>
    </html>
  );
}
