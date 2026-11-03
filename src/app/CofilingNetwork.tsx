"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884D8','#82CA9D','#FFC658','#FF7C7C','#8DD1E1','#D084D0'];
const NETWORK_TOP_N = 10;
const W = 760, H = 520;

// 全角=1、半角=0.55 として幅を数え、max を超えたら改行
const wrapLabel = (text: string, max = 9): string[] => {
  const lines: string[] = [];
  let cur = '', w = 0;
  for (const ch of Array.from(text)) {
    const cw = /[\x00-\x7f]/.test(ch) ? 0.55 : 1;
    if (w + cw > max && cur) { lines.push(cur); cur = ''; w = 0; }
    cur += ch; w += cw;
  }
  if (cur) lines.push(cur);
  return lines;
};

export const CofilingNetwork: React.FC<{
  edges: { source: string; target: string; count: number }[];
  allCompanies: Record<string, number>;
}> = ({ edges, allCompanies }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const animRef = useRef<number | null>(null);
  const posRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});

  const topCompanies = useMemo(() =>
    new Set(Object.entries(allCompanies).sort(([,a],[,b]) => b - a).slice(0, NETWORK_TOP_N).map(([n]) => n)),
    [allCompanies]
  );
  const nodes = useMemo(() =>
    Array.from(topCompanies).map(id => ({ id, count: allCompanies[id] || 0 })),
    [topCompanies, allCompanies]
  );
  const filteredEdges = useMemo(() =>
    edges.filter(e => topCompanies.has(e.source) && topCompanies.has(e.target)),
    [edges, topCompanies]
  );

  useEffect(() => {
    if (!nodes.length) return;
    const init: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      init[n.id] = { x: W / 2 + 230 * Math.cos(angle), y: H / 2 + 150 * Math.sin(angle), vx: 0, vy: 0 };
    });
    posRef.current = init;
    const maxEdge = filteredEdges.length > 0 ? Math.max(...filteredEdges.map(e => e.count)) : 1;
    let iter = 0;
    const tick = () => {
      const pos = posRef.current;
      const alpha = Math.max(0.01, 0.3 * Math.pow(0.92, iter));
      iter++;
      const ids = Object.keys(pos);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos[ids[i]], b = pos[ids[j]];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (12000 / (dist * dist)) * alpha;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
      filteredEdges.forEach(e => {
        const a = pos[e.source], b = pos[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const strength = (e.count / maxEdge) * 0.06 * alpha;
        const fx = dx * strength, fy = dy * strength;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      });
      ids.forEach(id => {
        const p = pos[id];
        p.vx += (W / 2 - p.x) * 0.004 * alpha;
        p.vy += (H / 2 - p.y) * 0.004 * alpha;
      });
      ids.forEach(id => {
        const p = pos[id];
        p.vx *= 0.85; p.vy *= 0.85;
        p.x = Math.max(80, Math.min(W - 80, p.x + p.vx));
        p.y = Math.max(45, Math.min(H - 85, p.y + p.vy));
      });
      setPositions(Object.fromEntries(ids.map(id => [id, { x: pos[id].x, y: pos[id].y }])));
      if (iter < 150) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [nodes, filteredEdges]);

  if (!nodes.length || !filteredEdges.length) {
    return (
      <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg">
        共同出願データなし（出願人欄に複数社が記載されているレコードが必要です）
      </div>
    );
  }

  const maxCount = Math.max(...nodes.map(n => n.count));
  const maxEdge = Math.max(...filteredEdges.map(e => e.count));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-gray-100 rounded-lg bg-gray-50">
        {filteredEdges.map((e, i) => {
          const a = positions[e.source], b = positions[e.target];
          if (!a || !b) return null;
          const w = 1.5 + (e.count / maxEdge) * 7;
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="#94a3b8" strokeWidth={w} strokeOpacity={0.55}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ x: mx, y: my, text: `${e.source} ↔ ${e.target}：${e.count}件` })}
                onMouseLeave={() => setTooltip(null)}
              />
              {w > 4 && <text x={mx} y={my - 5} textAnchor="middle" fontSize="9" fill="#475569">{e.count}件</text>}
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const p = positions[n.id];
          if (!p) return null;
          const r = 12 + (n.count / maxCount) * 20;
          const color = COLORS[i % COLORS.length];
          const lines = wrapLabel(n.id, 9);
          const fs = lines.length > 3 ? 8.5 : lines.length > 2 ? 9.5 : 11; // 行数が多いほど縮小
          const lh = fs + 2;
          return (
            <g key={n.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y - r - 8, text: `${n.id}：${n.count.toLocaleString()}件` })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity={0.6} stroke="white" strokeWidth={2.5} />
              <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(9, Math.min(12, r * 0.6))} fill="#1e293b" fontWeight="700">
                {n.count.toLocaleString()}
              </text>
              <text textAnchor="middle" fontSize={fs} fontWeight="600" fill="#1e293b"
                stroke="#f9fafb" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
                {lines.map((line, k) => (
                  <tspan key={k} x={p.x} y={p.y + r + fs + 3 + k * lh}>{line}</tspan>
                ))}
              </text>
            </g>
          );
        })}
        {tooltip && (
          <g pointerEvents="none">
            <rect x={tooltip.x - tooltip.text.length * 6 - 6} y={tooltip.y - 18}
              width={tooltip.text.length * 12 + 12} height={24} rx={5} fill="rgba(15,23,42,0.9)" />
            <text x={tooltip.x} y={tooltip.y - 2} textAnchor="middle" fontSize="11" fill="white">{tooltip.text}</text>
          </g>
        )}
      </svg>
      <p className="text-xs text-gray-400 mt-2 text-center">
        ※ 円の大きさ = 出願件数（円内の数字），線の太さ = 共同出願件数。上位{NETWORK_TOP_N}社を表示。社名は円の下に折り返して全文表示します。
      </p>
    </div>
  );
};
