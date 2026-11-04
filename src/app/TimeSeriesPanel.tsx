"use client";
import { TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884D8','#82CA9D','#FFC658','#FF7C7C','#8DD1E1','#D084D0'];
const WINDOW = 3; // 直近N年 vs その前N年

type Props = {
  title: string;
  accent: string;
  idPrefix: string;
  ranking: Record<string, number>;
  yearAnalysis: Record<string, Record<string, number>>;
  describe?: (name: string) => string;
  pdfMode?: boolean;
};
type Mode = 'multiples' | 'overlay';

const TrendBadge: React.FC<{ recent: number; prior: number }> = ({ recent, prior }) => {
  if (recent === 0 && prior === 0) return <span className="text-xs text-gray-400 whitespace-nowrap">—</span>;
  if (prior === 0) return <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">新規</span>;
  const pct = ((recent - prior) / prior) * 100;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-semibold whitespace-nowrap ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

export const TimeSeriesPanel: React.FC<Props> = ({ title, accent, idPrefix, ranking, yearAnalysis, describe, pdfMode = false }) => {
  const [mode, setMode] = useState<Mode>('multiples');
  const [topN, setTopN] = useState(6);
  const [sharedY, setSharedY] = useState(false);

  const view = useMemo(() => {
    const years = Array.from(new Set(Object.values(yearAnalysis).flatMap(o => Object.keys(o)))).map(Number).sort((a, b) => a - b);
    const names = Object.entries(ranking).sort(([, a], [, b]) => b - a).slice(0, topN).map(([n]) => n);
    const last = years[years.length - 1];
    const items = names.map((name, i) => {
      const series = years.map(y => ({ year: y, count: yearAnalysis[name]?.[String(y)] || 0 }));
      const total = series.reduce((a, b) => a + b.count, 0);
      const peak = series.reduce((a, b) => (b.count > a.count ? b : a), series[0] || { year: 0, count: 0 });
      let recent = 0, prior = 0;
      series.forEach(d => {
        if (d.year > last - WINDOW) recent += d.count;
        else if (d.year > last - WINDOW * 2) prior += d.count;
      });
      return { name, color: COLORS[i % COLORS.length], series, total, peak, recent, prior };
    });
    const maxY = Math.max(1, ...items.flatMap(it => it.series.map(d => d.count)));
    const overlay = years.map(y => {
      const row: Record<string, number> = { year: y };
      items.forEach(it => { row[it.name] = yearAnalysis[it.name]?.[String(y)] || 0; });
      return row;
    });
    return { years, items, maxY, overlay, last };
  }, [ranking, yearAnalysis, topN]);

  const btn = (active: boolean) =>
    `px-3 py-1 text-sm rounded-lg border transition-colors ${active ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <TrendingUp className="mr-2 h-6 w-6" style={{ color: accent }} />{title}
        </h2>
        <div className="flex flex-wrap items-center gap-2" data-html2canvas-ignore="true">
          <div className="flex gap-1">
            <button className={btn(mode === 'multiples')} onClick={() => setMode('multiples')}>個別に表示</button>
            <button className={btn(mode === 'overlay')} onClick={() => setMode('overlay')}>重ねて表示</button>
          </div>
          <select value={topN} onChange={e => setTopN(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
            {[3, 6, 9, 12].map(n => <option key={n} value={n}>上位{n}</option>)}
          </select>
          {mode === 'multiples' && (
            <select value={sharedY ? 'shared' : 'own'} onChange={e => setSharedY(e.target.value === 'shared')} className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
              <option value="own">縦軸：各自</option>
              <option value="shared">縦軸：共通</option>
            </select>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {mode === 'multiples'
          ? `上位${view.items.length}件を1つずつ表示します。▲▼は直近${WINDOW}年とその前${WINDOW}年の比較です。`
          : `上位${view.items.length}件を同じグラフに重ねて表示します。`}
      </p>

      {view.items.length === 0 || view.years.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">表示できるデータがありません。</p>
      ) : mode === 'multiples' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {view.items.map((it, i) => {
            const desc = describe ? describe(it.name) : '';
            const gid = `${idPrefix}-grad-${i}`;
            return (
              <div key={it.name} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 break-words leading-snug" title={it.name}>{it.name}</div>
                      {desc && <div className="text-[11px] text-gray-400 leading-tight">{desc}</div>}
                    </div>
                  </div>
                  <TrendBadge recent={it.recent} prior={it.prior} />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  計 <b className="text-gray-700">{it.total.toLocaleString()}</b>件　ピーク {it.peak.year}年（{it.peak.count}件）
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={it.series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={it.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={it.color} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false}
                      domain={sharedY ? [0, view.maxY] : [0, 'auto']} width={36} />
                    <Tooltip formatter={(v: any) => [`${v}件`, '出願件数']} labelFormatter={l => `${l}年`} />
                    <Area isAnimationActive={!pdfMode} type="linear" dataKey="count" stroke={it.color} strokeWidth={2}
                      fill={`url(#${gid})`} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={pdfMode ? 320 : 400}>
          <LineChart data={view.overlay}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
            {view.items.map(it => (
              <Line key={it.name} isAnimationActive={!pdfMode} type="linear" dataKey={it.name} name={it.name}
                stroke={it.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      <p className="text-xs text-gray-400 mt-3">※ 最新年は集計途中の場合があり、▲▼が実態より低く出ることがあります。</p>
    </div>
  );
};
