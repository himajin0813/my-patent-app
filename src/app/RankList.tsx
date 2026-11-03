import React from 'react';

type Item = { name: string; value: number };

// ランキング表示：順位・社名・件数・割合を1行にまとめ、細いバーで大小を示す
export const RankList: React.FC<{ data: Item[]; total: number; color: string }> = ({ data, total, color }) => {
  const max = data[0]?.value || 1;
  if (!data.length) return <p className="text-sm text-gray-400 py-6 text-center">データがありません</p>;
  return (
    <ol className="space-y-3">
      {data.map((d, i) => (
        <li key={d.name} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 items-start">
          <span
            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
            style={i < 3 ? { backgroundColor: color, opacity: 1 - i * 0.15 } : undefined}
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-gray-800 break-words leading-snug" title={d.name}>{d.name}</span>
              <span className="shrink-0 text-sm tabular-nums whitespace-nowrap">
                <b style={{ color }}>{d.value.toLocaleString()}</b>
                <span className="text-gray-400 text-xs ml-0.5">件</span>
                <span className="text-gray-500 text-xs ml-2 inline-block w-12 text-right">
                  {total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'}%
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
