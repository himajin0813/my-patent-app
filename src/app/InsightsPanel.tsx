"use client";
import { Activity } from 'lucide-react';
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type YearMap = Record<string, Record<string, number>>;
type Props = {
  yearCounts: Record<string, number>;
  allCompanies: Record<string, number>;
  companyYearAnalysis: YearMap;
  fiYearAnalysis: YearMap;
  getFiDescription: (code: string) => string;
};

const WINDOW = 3; // 直近N年 vs その前N年

const emerging = (ya: YearMap, years: number[]) => {
  if (years.length < 2) return [];
  const last = years[years.length - 1];
  const recent = (y: number) => y > last - WINDOW;
  const prior = (y: number) => y <= last - WINDOW && y > last - WINDOW * 2;
  return Object.entries(ya)
    .map(([name, byYear]) => {
      let r = 0, p = 0;
      Object.entries(byYear).forEach(([y, c]) => { const n = Number(y); if (recent(n)) r += c; else if (prior(n)) p += c; });
      return { name, recent: r, prior: p, delta: r - p };
    })
    .filter(x => x.recent >= 3 && x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 8);
};

const Kpi: React.FC<{ label: string; value: string; note?: string; tone?: string }> = ({ label, value, note, tone = 'text-gray-800' }) => (
  <div className="rounded-lg border border-gray-200 p-4">
    <div className="text-sm text-gray-500">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${tone}`}>{value}</div>
    {note && <div className="text-xs text-gray-400 mt-1">{note}</div>}
  </div>
);

const EmergingTable: React.FC<{ rows: ReturnType<typeof emerging>; years: number[]; describe?: (n: string) => string }> = ({ rows, years, describe }) => {
  const last = years[years.length - 1];
  if (!rows.length) return <p className="text-sm text-gray-400 py-4">該当なし（直近{WINDOW}年で3件以上かつ増加している項目がありません）</p>;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-500 text-left">
          <th className="py-1.5 pr-3">名称</th>
          <th className="py-1.5 px-3 text-right">{last - WINDOW * 2 + 1}–{last - WINDOW}</th>
          <th className="py-1.5 px-3 text-right">{last - WINDOW + 1}–{last}</th>
          <th className="py-1.5 pl-3 text-right">増減</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map(r => (
          <tr key={r.name}>
            <td className="py-1.5 pr-3">
              <span className="font-medium text-gray-800">{r.name}</span>
              {describe && describe(r.name) && <span className="ml-2 text-xs text-gray-400">{describe(r.name)}</span>}
            </td>
            <td className="py-1.5 px-3 text-right text-gray-500">{r.prior}</td>
            <td className="py-1.5 px-3 text-right text-gray-700">{r.recent}</td>
            <td className="py-1.5 pl-3 text-right font-bold text-emerald-600">+{r.delta}{r.prior === 0 && <span className="ml-1 text-xs font-normal">新規</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const InsightsPanel: React.FC<Props> = ({ yearCounts, allCompanies, companyYearAnalysis, fiYearAnalysis, getFiDescription }) => {
  const m = useMemo(() => {
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
    if (years.length === 0) return null;
    const series = years.map(y => ({ year: y, count: yearCounts[String(y)] }));
    const yoy = series.slice(1).map((s, i) => {
      const prev = series[i].count;
      return { year: s.year, rate: prev > 0 ? Math.round(((s.count - prev) / prev) * 1000) / 10 : 0 };
    });
    const peak = series.reduce((a, b) => (b.count > a.count ? b : a));
    const first = series[0], last = series[series.length - 1];
    const span = last.year - first.year;
    const cagr = span > 0 && first.count > 0 ? (Math.pow(last.count / first.count, 1 / span) - 1) * 100 : null;
    const counts = Object.values(allCompanies);
    const total = counts.reduce((a, b) => a + b, 0);
    const cr5 = total ? [...counts].sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0) / total * 100 : null;
    const hhi = total ? counts.reduce((a, c) => a + Math.pow((c / total) * 100, 2), 0) : null;
    return {
      years, yoy, peak, last, cagr, cr5, hhi,
      lastYoy: yoy.length ? yoy[yoy.length - 1] : null,
      companies: emerging(companyYearAnalysis, years),
      fis: emerging(fiYearAnalysis, years),
    };
  }, [yearCounts, allCompanies, companyYearAnalysis, fiYearAnalysis]);

  if (!m) return null;
  const hhiLabel = m.hhi === null ? '' : m.hhi < 1500 ? '分散型' : m.hhi < 2500 ? '中程度の集中' : '寡占的';
  const fmt = (v: number | null, d = 1) => (v === null ? 'N/A' : v.toFixed(d));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Activity className="mr-2 h-6 w-6 text-emerald-600" />トレンド・競争環境インサイト</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="ピーク年" value={`${m.peak.year}年`} note={`${m.peak.count.toLocaleString()}件`} />
        <Kpi label={`前年比（${m.lastYoy?.year ?? '-'}年）`} value={m.lastYoy ? `${m.lastYoy.rate > 0 ? '+' : ''}${m.lastYoy.rate}%` : 'N/A'}
          tone={m.lastYoy && m.lastYoy.rate < 0 ? 'text-red-600' : 'text-emerald-600'} note="最終年は集計途中の可能性あり" />
        <Kpi label="年平均成長率（CAGR）" value={m.cagr === null ? 'N/A' : `${m.cagr > 0 ? '+' : ''}${fmt(m.cagr)}%`} note={`${m.years[0]}→${m.last.year}`} />
        <Kpi label="上位5社集中度（CR5）" value={m.cr5 === null ? 'N/A' : `${fmt(m.cr5)}%`} note={m.hhi === null ? undefined : `HHI ${Math.round(m.hhi)}（${hhiLabel}）`} />
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-2">出願件数の前年比（%）</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={m.yoy}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis unit="%" />
          <Tooltip formatter={(v: any) => [`${v}%`, '前年比']} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Bar dataKey="rate">{m.yoy.map((d, i) => <Cell key={i} fill={d.rate >= 0 ? '#10b981' : '#ef4444'} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">伸びている出願人</h3>
          <p className="text-xs text-gray-400 mb-2">直近{WINDOW}年と、その前{WINDOW}年の出願件数を比較</p>
          <div className="overflow-x-auto"><EmergingTable rows={m.companies} years={m.years} /></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">伸びている技術分野（FI）</h3>
          <p className="text-xs text-gray-400 mb-2">直近{WINDOW}年と、その前{WINDOW}年の出願件数を比較</p>
          <div className="overflow-x-auto"><EmergingTable rows={m.fis} years={m.years} describe={getFiDescription} /></div>
        </div>
      </div>
    </div>
  );
};
