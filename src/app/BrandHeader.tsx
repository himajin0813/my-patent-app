import React from 'react';

type Props = { title: string; subtitle: string };

export const BrandHeader: React.FC<Props> = ({ title, subtitle }) => (
  <header
    className="rounded-xl shadow-lg border border-blue-200 px-6 py-5 flex items-center gap-5"
    style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%)' }}
  >
    <div
      aria-hidden
      className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-slate-900 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%)' }}
    >
      HM
    </div>
    <div className="min-w-0">
      <div className="text-xs font-semibold tracking-[0.22em] text-cyan-700">HIMAJIN MIND</div>
      <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 leading-tight">{title}</h1>
      <p className="text-sm sm:text-base text-slate-600 mt-1">{subtitle}</p>
    </div>
  </header>
);
