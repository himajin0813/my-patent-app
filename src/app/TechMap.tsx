"use client";
import { LayoutGrid } from 'lucide-react';
import React, { useMemo, useState } from 'react';

type Props = {
  rows: any[];
  applicantCol: string;
  fiCol: string;
  splitCompanies: (v: string) => string[];
  getFiDescription: (code: string) => string;
};
type Mode = 'count' | 'share';

const SUBCLASS = /^[A-H]\d{2}[A-Z]$/;

export const TechMap: React.FC<Props> = ({ rows, applicantCol, fiCol, splitCompanies, getFiDescription }) => {
  const [mode, setMode] = useState<Mode>('count');
  const [nCo, setNCo] = useState(10);
  const [nFi, setNFi] = useState(12);

  const m = useMemo(() => {
    const cell: Record<string, Record<string, number>> = {};
    const coTotal: Record<string, number> = {};
    const fiTotal: Record<string, number> = {};
    rows.forEach(row => {
      const cv = row[applicantCol], fv = row[fiCol];
      if (!cv || !fv) return;
      const cos = splitCompanies(cv);
      const subs = Array.from(new Set(
        String(fv).split(/[;,\n]/).map(c => c.replace(/\s/g, '').toUpperCase().substring(0, 4)).filter(c => SUBCLASS.test(c))
      ));
      if (!cos.length || !subs.length) return;
      cos.forEach(co => {
        coTotal[co] = (coTotal[co] || 0) + 1;
        if (!cell[co]) cell[co] = {};
        subs.forEach(sb => { cell[co][sb] = (cell[co][sb] || 0) + 1; });
      });
      subs.forEach(sb => { fiTotal[sb] = (fiTotal[sb] || 0) + 1; });
    });
    return { cell, coTotal, fiTotal };
  }, [rows, applicantCol, fiCol, splitCompanies]);

  const view = useMemo(() => {
    const companies = Object.entries(m.coTotal).sort(([, a], [, b]) => b - a).slice(0, nCo).map(([n]) => n);
    const subs = Object.entries(m.fiTotal).sort(([, a], [, b]) => b - a).slice(0, nFi).map(([c]) => c);
    const val = (co: string, sb: string) => {
      const c = m.cell[co]?.[sb] || 0;
      return mode === 'count' ? c : (m.coTotal[co] ? (c / m.coTotal[co]) * 100 : 0);
    };
    let max = 0;
    companies.forEach(co => subs.forEach(sb => { max = Math.max(max, val(co, sb)); }));

    // 各社の得意分野（表示中の分野のうち構成比上位2、2件以上）
    const strengths = companies.slice(0, 5).map(co => {
      const top = subs
        .map(sb => ({ sb, c: m.cell[co]?.[sb] || 0, share: m.coTotal[co] ? ((m.cell[co]?.[sb] || 0) / m.coTotal[co]) * 100 : 0 }))
        .filter(x => x.c >= 2)
        .sort((a, b) => b.share - a.share)
        .slice(0, 2);
      return { co, top };
    }).filter(x => x.top.length > 0);

    // 参入企業が少ない分野（表示企業のうち出願のある企業が2社以下）
    const sparse = subs
      .map(sb => ({ sb, n: companies.filter(co => (m.cell[co]?.[sb] || 0) > 0).length }))
      .filter(x => x.n <= 2);

    return { companies, subs, val, max, strengths, sparse };
  }, [m, nCo, nFi, mode]);

  const label = (sb: string) => {
    const d = getFiDescription(sb);
    return d ? `${sb}（${d}）` : sb;
  };

  if (view.companies.length === 0 || view.subs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center"><LayoutGrid className="mr-2 h-6 w-6 text-indigo-600" />技術分野マップ（出願人 × FI）</h2>
        <p className="text-sm text-gray-400 py-6 text-center">出願人とFIの両方が入力されているレコードがありません。</p>
      </div>
    );
  }

  const btn = (active: boolean) =>
    `px-3 py-1 text-sm rounded-lg border transition-colors ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center"><LayoutGrid className="mr-2 h-6 w-6 text-indigo-600" />技術分野マップ（出願人 × FI）</h2>
      <p className="text-sm text-gray-500 mb-4">
        FIサブクラス（4文字）ごとに、各社の出願がどこに集中しているかを色の濃さで示します。空白のマスはその企業の出願がない分野です。
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4" data-html2canvas-ignore="true">
        <div className="flex gap-1">
          <button className={btn(mode === 'count')} onClick={() => setMode('count')}>件数</button>
          <button className={btn(mode === 'share')} onClick={() => setMode('share')}>各社内の割合</button>
        </div>
        <label className="text-sm text-gray-600 flex items-center gap-1">
          企業数
          <select value={nCo} onChange={e => setNCo(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
            {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-600 flex items-center gap-1">
          分野数
          <select value={nFi} onChange={e => setNFi(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
            {[8, 12, 16].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse min-w-[760px]">
          <colgroup>
            <col style={{ width: 190 }} />
            {view.subs.map(sb => <col key={sb} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 px-2 py-2 align-bottom">出願人</th>
              {view.subs.map(sb => (
                <th key={sb} className="px-1 py-2 align-bottom text-center" title={label(sb)}>
                  <div className="font-mono text-xs font-bold text-gray-700">{sb}</div>
                  <div className="text-[10px] leading-tight text-gray-400 font-normal break-words">{getFiDescription(sb)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.companies.map(co => (
              <tr key={co}>
                <td className="px-2 py-1 text-xs font-medium text-gray-800 break-words leading-tight" title={co}>
                  {co}
                  <span className="ml-1 text-[10px] text-gray-400">{m.coTotal[co]}件</span>
                </td>
                {view.subs.map(sb => {
                  const v = view.val(co, sb);
                  const count = m.cell[co]?.[sb] || 0;
                  const alpha = v > 0 && view.max > 0 ? 0.1 + 0.9 * Math.sqrt(v / view.max) : 0;
                  return (
                    <td key={sb}
                      title={`${co} × ${label(sb)}：${count}件（${m.coTotal[co] ? ((count / m.coTotal[co]) * 100).toFixed(1) : 0}%）`}
                      className="border border-white text-center text-[11px] h-9"
                      style={{
                        backgroundColor: v > 0 ? `rgba(79,70,229,${alpha.toFixed(3)})` : '#f3f4f6',
                        color: alpha > 0.55 ? '#ffffff' : '#374151',
                      }}>
                      {v > 0 ? (mode === 'count' ? count : `${v.toFixed(0)}%`) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        ※ 1件の特許に複数のFIが付与されるため、「各社内の割合」は各社の出願のうち当該分野を含むものの比率で、合計は100%を超えます。マスにカーソルを当てると詳細が表示されます。
      </p>

      {(view.strengths.length > 0 || view.sparse.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
          {view.strengths.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">各社の得意分野</h3>
              <ul className="space-y-1.5 text-sm">
                {view.strengths.map(s => (
                  <li key={s.co}>
                    <span className="font-medium text-gray-800">{s.co}</span>
                    <span className="text-gray-500">：</span>
                    {s.top.map((t, i) => (
                      <span key={t.sb} className="text-gray-600">
                        {i > 0 && ' / '}{label(t.sb)} <span className="text-indigo-600 font-semibold">{t.share.toFixed(0)}%</span>
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {view.sparse.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">参入企業が少ない分野</h3>
              <p className="text-xs text-gray-400 mb-2">表示中の企業のうち、出願があるのが2社以下の分野です。</p>
              <ul className="space-y-1 text-sm">
                {view.sparse.map(x => (
                  <li key={x.sb} className="text-gray-600">
                    {label(x.sb)} <span className="text-gray-400">（{x.n}社）</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
