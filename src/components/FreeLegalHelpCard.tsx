'use client';

import React from 'react';
import { PhoneCall, Landmark, ShieldCheck, Scale, Info } from 'lucide-react';

export const FreeLegalHelpCard: React.FC = () => {
  return (
    <div className="bg-[#0B1528] rounded-2xl border-2 border-[#C6A15B]/40 p-6 shadow-xl space-y-4 text-slate-200">
      <div className="flex items-center space-x-3 pb-3 border-b border-[#1B2A4A]">
        <div className="p-2.5 bg-[#C6A15B]/20 rounded-xl border border-[#C6A15B]/40 text-[#E5C788]">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold font-serif text-white">Get Free Legal Aid &amp; Help in India</h3>
          <p className="text-xs text-slate-400">Government schemes guaranteeing legal aid under Article 39A</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* NALSA Helpline Card */}
        <div className="bg-[#12203C] p-4 rounded-xl border border-emerald-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <PhoneCall className="w-4 h-4" />
            <span>NALSA National Helpline</span>
          </div>
          <p className="text-white text-lg font-bold font-mono">Dial 15100</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Free 24/7 National Legal Services Authority helpline providing immediate legal guidance across all States.
          </p>
        </div>

        {/* DLSA & Court Services */}
        <div className="bg-[#12203C] p-4 rounded-xl border border-[#C6A15B]/30 space-y-2">
          <div className="flex items-center space-x-2 text-[#E5C788] font-bold">
            <Scale className="w-4 h-4" />
            <span>DLSA &amp; District Courts</span>
          </div>
          <p className="text-white text-sm font-bold font-serif">District Legal Services Authority</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Visit the Front Office at any District Court premises to request a free appointed advocate.
          </p>
        </div>

        {/* Lok Adalat Services */}
        <div className="bg-[#12203C] p-4 rounded-xl border border-sky-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Lok Adalat Settlement</span>
          </div>
          <p className="text-white text-sm font-bold font-serif">Amicable Pre-Litigation</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Fast, free, and non-adversarial resolution for consumer, bank, landlord, and petty civil disputes.
          </p>
        </div>
      </div>

      <div className="p-3 bg-[#12203C]/80 rounded-xl border border-[#1B2A4A] text-[11px] text-slate-300 flex items-start space-x-2">
        <Info className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#E5C788]">Who is eligible for Free Legal Aid?</strong> Women, children, members of SC/ST, industrial workmen, persons in custody, victims of disaster, and citizens with annual income below prescribed statutory limits are entitled to free lawyer services under the Legal Services Authorities Act 1987.
        </p>
      </div>
    </div>
  );
};
