'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  LayoutDashboard,
  FileText,
  Network,
  MessageSquare,
  BookOpen,
  Users,
  CheckCircle2,
  ScanSearch,
} from 'lucide-react';
import { useCaseContext } from '@/context/CaseContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { documentInfo } = useCaseContext();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: documentInfo ? 'Active' : null,
    },
    {
      href: '/analysis',
      label: 'Case Analysis',
      icon: FileText,
      badge: 'Summary & Checklist',
    },
    {
      href: '/graph',
      label: 'Entity Graph',
      icon: Network,
      badge: 'SVG Visualizer',
    },
    {
      href: '/chat',
      label: 'Grounded Q&A',
      icon: MessageSquare,
      badge: 'Cited Answers',
    },
    {
      href: '/precedents',
      label: 'Precedent Matcher',
      icon: BookOpen,
      badge: 'SC Rulings',
    },
    {
      href: '/public',
      label: 'Know Your Rights',
      icon: Users,
      badge: 'Public Legal AI',
    },
  ];

  return (
    <aside className="w-64 bg-[#0B1528] border-r-2 border-[#C6A15B]/40 text-white flex flex-col h-full shrink-0 shadow-2xl z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1B2A4A] flex items-center space-x-3.5 bg-gradient-to-r from-[#0B1528] via-[#0F1A30] to-[#0B1528]">
        <div className="relative flex items-center justify-center w-9 h-9">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E5C788] via-[#C6A15B] to-[#86682B] rotate-45 rounded-[5px] shadow-lg border border-[#F5E8C9]/30" />
          <Scale className="relative w-4 h-4 text-[#0B1528] stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide font-serif text-white leading-none">
            NyaySetu
          </h1>
          <p className="text-[10px] text-[#C6A15B] font-semibold tracking-wider uppercase mt-1">
            AI Legal Assistant
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          Workspace Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-premium group ${
                isActive
                  ? 'bg-gradient-to-r from-[#C6A15B] to-[#A4813A] text-[#0B1528] font-bold shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-[#12203C] border border-transparent hover:border-[#1B2A4A]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#0B1528]' : 'text-[#C6A15B]'
                  }`}
                />
                <span className="font-serif tracking-wide text-[13px]">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-[#0B1528]/20 text-[#0B1528]'
                      : 'bg-[#12203C] text-slate-400 border border-[#1B2A4A]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Loaded Case Footer Card */}
      <div className="p-4 border-t border-[#1B2A4A] bg-[#0A1224]">
        {documentInfo ? (
          <div className="bg-[#12203C] p-3 rounded-xl border border-[#1B2A4A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#C6A15B] tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Loaded Case</span>
              </span>
              {documentInfo.ocrUsed && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-0.5">
                  <ScanSearch className="w-2.5 h-2.5" />
                  <span>OCR</span>
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-white truncate font-serif" title={documentInfo.fileName}>
              {documentInfo.fileName}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1B2A4A]/60">
              <span>{documentInfo.numPages} Pages</span>
              <span>{documentInfo.totalChunks} Chunks</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 space-y-1">
            <p className="text-[11px] text-slate-400 font-medium">No Case Loaded</p>
            <p className="text-[10px] text-slate-500">Upload a court PDF on Dashboard</p>
          </div>
        )}
      </div>
    </aside>
  );
};
