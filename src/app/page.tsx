"use client";
import { BarChart3, ChevronDown, ChevronUp, Download, Filter, Search, Share2, Table, Target, TrendingUp, Upload, X } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// ===== FI サブクラス 日本語対応表（A〜H全セクション） =====
const FI_SUBCLASS_JA: Record<string, string> = {
  "A01B":"農業・林業・養蜂（土壌加工）","A01C":"植付・播種","A01D":"収穫","A01F":"脱穀・藁処理",
  "A01G":"園芸・野菜栽培・きのこ栽培","A01H":"新植物・組織培養","A01J":"乳製品製造",
  "A01K":"動物の飼育・漁業・捕獲","A01M":"害虫駆除","A01N":"生物材料の保存",
  "A21D":"パン・ケーキ処理","A22C":"食肉・魚・家禽の加工","A23B":"食品保存","A23C":"乳製品",
  "A23D":"食用油脂","A23F":"コーヒー・茶・代用品","A23G":"カカオ・チョコレート・菓子",
  "A23K":"飼料","A23L":"食品・食品製造・栄養","A24F":"喫煙具",
  "A41D":"外衣・作業服・防護服","A43B":"靴の特徴","A44B":"ボタン・ファスナー",
  "A45C":"鞄・財布","A45D":"美容器具","A46B":"ブラシ","A47B":"テーブル・机・棚",
  "A47C":"椅子・ソファ・ベッド","A47J":"台所器具・コーヒーメーカー","A47K":"衛生設備",
  "A61B":"診断・手術・識別","A61C":"歯科・口腔衛生","A61F":"補綴・整形外科",
  "A61H":"物理療法","A61K":"医薬品製剤","A61L":"材料の滅菌・消毒",
  "A61M":"体内への物質導入","A61N":"電気・放射線療法","A61P":"医薬品の治療活性",
  "A61Q":"化粧品の用途","A62B":"救助・脱出・保護","A62C":"消防",
  "A63B":"体操・スポーツ用具","A63F":"カードゲーム・盤上ゲーム","A63H":"玩具",
  "B01D":"分離","B01F":"混合・混練","B01J":"化学的・物理的方法","B01L":"化学・物理実験室機器",
  "B02C":"粉砕・破砕","B03B":"湿式選鉱","B03C":"磁気・静電気的分離",
  "B04B":"遠心分離機","B05B":"噴霧・霧化・散布","B05C":"塗布機械","B05D":"塗装プロセス",
  "B06B":"超音波・振動発生","B07B":"ふるい分け・選別","B08B":"洗浄・清掃",
  "B09B":"固体廃棄物処理","B09C":"汚染土壌修復","B21B":"金属圧延",
  "B21C":"金属線・管・棒の製造","B21D":"金属板・管の加工","B22D":"金属鋳造",
  "B22F":"金属粉末の加工","B23B":"旋削・ボーリング","B23C":"フライス加工",
  "B23K":"溶接・ろう付け・切断","B23P":"金属加工","B24B":"研削・研磨",
  "B25J":"マニピュレータ・ロボット","B26D":"切断","B29B":"ゴム・プラスチック前処理",
  "B29C":"ゴム・プラスチック成形","B30B":"プレス","B31B":"箱・袋の製造",
  "B32B":"積層体","B33Y":"付加製造（3Dプリンティング）",
  "B41J":"タイプライタ・選択的印字機構","B41M":"印刷方法・複写","B42D":"紙・ボール紙製品",
  "B43K":"筆記具","B44C":"装飾技術","B60B":"車輪","B60C":"車両用タイヤ",
  "B60D":"牽引連結","B60G":"車両サスペンション","B60H":"車両用暖房・冷房・換気",
  "B60J":"窓・ドア・幌","B60K":"駆動装置・推進装置","B60L":"電気式車両の推進",
  "B60N":"車両用座席","B60Q":"車両用照明・信号","B60R":"車両の安全装置",
  "B60S":"車両の整備・補給","B60T":"車両制動","B60W":"複合型車両制御",
  "B61B":"鉄道システム","B61C":"機関車","B61L":"鉄道交通制御",
  "B62D":"自動車・トレーラ","B62K":"自転車・一輪車","B63B":"船舶・その他水上構造物",
  "B63H":"船舶の推進・操縦","B64C":"航空機・ヘリコプタ","B64D":"航空機装備",
  "B64G":"宇宙技術","B65B":"包装機械","B65D":"容器・包装","B65G":"搬送・積み込み",
  "B65H":"シート材料・繊維の取り扱い","B66B":"エレベータ・エスカレータ",
  "B66C":"クレーン・巻き上げ機","B67D":"液体分配",
  "C01B":"非金属元素・化合物","C01C":"アンモニア・シアン化合物",
  "C01D":"アルカリ金属化合物","C01G":"その他の無機化合物",
  "C02F":"水・廃水・汚水処理","C03B":"ガラス製造","C03C":"ガラス・釉薬の組成",
  "C04B":"セメント・コンクリート・陶磁器","C05D":"無機肥料","C06B":"爆発物組成",
  "C07B":"有機化学の一般的方法","C07C":"非環式・炭素環式化合物",
  "C07D":"複素環式化合物","C07F":"金属を含む有機化合物",
  "C07H":"糖類化合物","C07J":"ステロイド","C07K":"ペプチド",
  "C08F":"炭素・炭素不飽和結合の重合","C08G":"その他の重合","C08J":"高分子材料の加工",
  "C08K":"高分子組成物の配合剤","C08L":"高分子組成物","C09B":"有機染料・天然染料",
  "C09C":"顔料・充填剤","C09D":"塗料・ワニス・ラッカー","C09J":"接着剤",
  "C09K":"特殊用途材料","C10B":"コークス製造・石炭ガス","C10G":"炭化水素油処理",
  "C10L":"燃料・燃料添加剤","C10M":"潤滑組成物","C11D":"洗剤",
  "C12N":"微生物・酵素・組換えDNA技術","C12P":"発酵・酵素による化学的製造",
  "C12Q":"酵素・微生物を用いる測定・試験","C13B":"砂糖の製造",
  "C14B":"皮革製造","C21B":"銑鉄・海綿鉄の製造","C21C":"銑鉄処理・鋼の製造",
  "C21D":"鉄・鋼の改質","C22B":"金属の製造・精製","C22C":"合金",
  "C22F":"金属・合金の変態","C23C":"金属への被覆","C23F":"金属の化学処理",
  "C23G":"金属の洗浄・脱スケール","C25B":"電解による化学製造",
  "C25D":"電解・電気泳動による被覆","C30B":"単結晶成長","C40B":"コンビナトリアル化学",
  "D01D":"化学繊維の製造","D01F":"化学繊維の組成","D01H":"紡糸・撚糸",
  "D03D":"織物","D04B":"編み物","D04H":"不織布","D05B":"ミシン",
  "D06F":"洗濯・乾燥","D06M":"繊維の化学処理","D06P":"繊維の染色・捺染",
  "D21C":"セルロースパルプ製造","D21F":"製紙機械","D21H":"製紙用組成物",
  "E01B":"鉄道軌道","E01C":"道路・飛行場","E01D":"橋梁","E01H":"道路の維持",
  "E02B":"水工構造物","E02D":"基礎・掘削","E02F":"掘削・土工機械",
  "E03B":"給水設備","E03C":"室内給排水","E03D":"水洗便所","E03F":"下水道",
  "E04B":"建築構造一般","E04C":"構造要素","E04D":"屋根","E04F":"建築仕上げ工事",
  "E04G":"足場・型枠・建築用工具","E04H":"建物・構造物一般",
  "E05B":"錠・鍵","E05D":"蝶番・枢軸","E06B":"開口部の建具",
  "E21B":"掘削","E21C":"採掘","E21D":"坑道・竪坑",
  "F01B":"機械・エンジン一般","F01C":"回転式ピストン機関",
  "F01D":"非往復式機械・エンジン","F01K":"蒸気機関","F01L":"動弁機構",
  "F01M":"潤滑","F01N":"排気処理","F01P":"エンジン冷却",
  "F02B":"内燃機関","F02C":"ガスタービン","F02D":"内燃機関の制御",
  "F02F":"シリンダ・ピストン","F02K":"ジェット推進","F02M":"燃料供給",
  "F02P":"点火","F03B":"水力機械","F03D":"風力機械",
  "F04B":"往復式ポンプ","F04C":"回転式ポンプ","F04D":"非往復式ポンプ",
  "F15B":"流体圧アクチュエータ","F16B":"機械要素（締結）","F16C":"軸・軸受",
  "F16D":"クラッチ・制動","F16F":"ばね・緩衝・振動絶縁",
  "F16H":"変速機","F16J":"ピストン・シール","F16K":"弁・栓・コック",
  "F16L":"管・管継手・管付属品","F16N":"潤滑",
  "F21S":"照明システム","F21V":"照明器具の機能・構造",
  "F22B":"ボイラー","F23B":"固体燃料燃焼","F23C":"流動燃料燃焼",
  "F23D":"バーナー","F23G":"廃棄物焼却","F23N":"燃焼制御",
  "F24B":"家庭用暖房炉","F24C":"家庭用調理・加熱器具","F24D":"温水・蒸気暖房",
  "F24F":"空気調和","F24H":"流体加熱器","F24S":"太陽熱集熱器",
  "F25B":"冷凍機・ヒートポンプ","F25C":"製氷・雪製造","F25D":"冷蔵庫・冷凍庫",
  "F25J":"ガスの液化・分離","F26B":"乾燥","F27B":"炉・窯",
  "F28D":"熱交換器一般","F28F":"熱交換器の要素",
  "F41A":"火器の機能","F42B":"弾薬・爆弾",
  "G01B":"長さ・角度・面積の測定","G01C":"距離・速度・方位の測定",
  "G01D":"測定一般","G01F":"体積・流量の測定","G01G":"はかり",
  "G01H":"振動・音の測定","G01J":"強度・色・分光の測定",
  "G01K":"温度測定","G01L":"力・圧力・応力の測定",
  "G01M":"機械・構造物の試験","G01N":"材料の化学・物理試験",
  "G01P":"速度・加速度・衝撃の測定","G01Q":"走査プローブ顕微鏡",
  "G01R":"電気・磁気測定","G01S":"電波・音波・光波測位",
  "G01T":"放射線測定","G01V":"地球物理探査","G01W":"気象学",
  "G02B":"光学素子・光学系","G02C":"眼鏡","G02F":"光の変調・制御",
  "G03B":"写真・映画撮影機械","G03C":"感光材料","G03D":"写真処理機械",
  "G03F":"フォトメカニカルの製造","G03G":"電子写真・磁気記録","G03H":"ホログラフィー",
  "G04B":"時計の機構","G04C":"電気・電子時計","G04F":"時間間隔の測定",
  "G05B":"制御システム一般","G05D":"非電気的変量の制御","G05F":"電気量の制御",
  "G06F":"電気的デジタルデータ処理","G06K":"データ認識・データ表示",
  "G06N":"機械学習・AI","G06Q":"行政・商業・金融・管理データ処理",
  "G06T":"イメージデータ処理","G06V":"画像・動画認識",
  "G07B":"切符・料金表示機","G07D":"硬貨・紙幣処理","G07F":"自動販売機",
  "G08B":"信号・警報","G08C":"測定値・制御信号の伝送","G08G":"交通制御",
  "G09B":"教育・訓練用具","G09F":"表示・広告・標識","G09G":"静止画・動画の表示",
  "G10H":"電子楽器","G10K":"音響・超音波","G10L":"音声分析・合成・認識",
  "G11B":"情報記憶","G11C":"静的記憶","G12B":"計器・計器部品",
  "G16B":"バイオインフォマティクス","G16H":"医療情報","G16Y":"IoT",
  "G21C":"核反応炉","G21F":"放射線防護","G21H":"放射線の利用",
  "H01B":"電線・ケーブル","H01C":"抵抗器","H01F":"磁石・インダクタンス・変圧器",
  "H01G":"コンデンサ","H01H":"電気的スイッチ","H01J":"電子管",
  "H01K":"白熱電球","H01L":"半導体装置","H01M":"電気化学的エネルギー変換（電池）",
  "H01P":"導波管・共振器","H01Q":"アンテナ","H01R":"電気的接続",
  "H01S":"レーザー・メーザー","H01T":"放電管",
  "H02B":"配電盤・開閉器","H02G":"電気導体の布設","H02H":"保護回路",
  "H02J":"電力の給電・配電","H02K":"電動機・発電機","H02M":"電力変換",
  "H02N":"その他の電気機械","H02P":"電動機の制御","H02S":"太陽光発電",
  "H03B":"発振・パルス発生","H03C":"変調","H03D":"復調","H03F":"増幅器",
  "H03G":"増幅の制御","H03H":"インピーダンス回路網","H03K":"パルス技術",
  "H03M":"符号化・復号化","H04B":"伝送","H04J":"多重通信","H04K":"秘密通信",
  "H04L":"デジタル情報の伝送","H04M":"電話通信","H04N":"画像通信",
  "H04Q":"選択","H04R":"音響変換","H04S":"ステレオ音響",
  "H04W":"無線通信ネットワーク","H05B":"電気加熱・電気照明",
  "H05F":"静電気","H05G":"X線技術","H05H":"プラズマ・放射線加速器",
  "H05K":"印刷回路・電子部品の実装",
};

const getFiDescription = (fiCode: string): string => {
  if (!fiCode) return '';
  const normalized = fiCode.replace(/\s/g, '').toUpperCase();
  // 4文字サブクラス（例: H01L）
  const sub4 = normalized.substring(0, 4);
  if (FI_SUBCLASS_JA[sub4]) return FI_SUBCLASS_JA[sub4];
  // 3文字（例: A01）
  const sub3 = normalized.substring(0, 3);
  const found = Object.entries(FI_SUBCLASS_JA).find(([k]) => k.startsWith(sub3));
  return found ? found[1] : '';
};

// ===== 型定義 =====
type AnalysisResults = {
  yearCounts: Record<string, number>;
  leadingCompanies: Record<string, number>;
  allCompanies: Record<string, number>;
  leadingFIs: Record<string, number>;
  allFIs: Record<string, number>;
  companyYearAnalysis: Record<string, Record<string, number>>;
  fiYearAnalysis: Record<string, Record<string, number>>;
  cofilingEdges: { source: string; target: string; count: number }[];
  hasApplicantData: boolean;
  hasFIData: boolean;
};
type SortConfig = { key: string; direction: 'asc' | 'desc' };
type FilterConfig = {
  yearFrom: string;
  yearTo: string;
  companyKeywords: string[];
  companyMode: 'AND' | 'OR';
  companyExclude: string[];
  selectedCompanies: string[];
  fiKeywords: string[];
  fiMode: 'AND' | 'OR';
  fiExclude: string[];
  titleKeywords: string[];
  titleMode: 'AND' | 'OR';
  titleExclude: string[];
};
type ActiveTab = 'charts' | 'table';

const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884D8','#82CA9D','#FFC658','#FF7C7C','#8DD1E1','#D084D0'];
const PAGE_SIZE = 50;
const NETWORK_TOP_N = 10;

// ===== 共同出願ネットワーク（D3不使用・自前シミュレーション） =====
const CofilingNetwork: React.FC<{
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
    const W = 700, H = 420;
    const init: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      init[n.id] = { x: W / 2 + 160 * Math.cos(angle), y: H / 2 + 140 * Math.sin(angle), vx: 0, vy: 0 };
    });
    posRef.current = init;
    const maxEdge = filteredEdges.length > 0 ? Math.max(...filteredEdges.map(e => e.count)) : 1;
    let iter = 0;
    const tick = () => {
      const pos = posRef.current;
      const alpha = Math.max(0.01, 0.3 * Math.pow(0.92, iter));
      iter++;
      const ids = Object.keys(pos);
      // 反発力
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos[ids[i]], b = pos[ids[j]];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (6000 / (dist * dist)) * alpha;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
      // 引力（エッジ）
      filteredEdges.forEach(e => {
        const a = pos[e.source], b = pos[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const strength = (e.count / maxEdge) * 0.08 * alpha;
        const fx = dx * strength, fy = dy * strength;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      });
      // 中心引力
      ids.forEach(id => {
        const p = pos[id];
        p.vx += (W / 2 - p.x) * 0.005 * alpha;
        p.vy += (H / 2 - p.y) * 0.005 * alpha;
      });
      // 更新
      ids.forEach(id => {
        const p = pos[id];
        p.vx *= 0.85; p.vy *= 0.85;
        p.x = Math.max(60, Math.min(W - 60, p.x + p.vx));
        p.y = Math.max(40, Math.min(H - 40, p.y + p.vy));
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
      <svg viewBox="0 0 700 420" className="w-full border border-gray-100 rounded-lg bg-gray-50">
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
              {w > 4 && (
                <text x={mx} y={my - 5} textAnchor="middle" fontSize="9" fill="#475569">{e.count}件</text>
              )}
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const p = positions[n.id];
          if (!p) return null;
          const r = 14 + (n.count / maxCount) * 24;
          const color = COLORS[i % COLORS.length];
          const label = n.id.length > 12 ? n.id.substring(0, 12) + '…' : n.id;
          return (
            <g key={n.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y - r - 8, text: `${n.id}：${n.count.toLocaleString()}件` })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity={0.55} stroke="white" strokeWidth={2.5} />
              <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(8, Math.min(11, r * 0.55))} fill="#1e293b" fontWeight="700">
                {label}
              </text>
            </g>
          );
        })}
        {tooltip && (
          <g>
            <rect x={tooltip.x - tooltip.text.length * 3.5 - 4} y={tooltip.y - 16}
              width={tooltip.text.length * 7 + 8} height={22} rx={5} fill="rgba(15,23,42,0.88)" />
            <text x={tooltip.x} y={tooltip.y - 3} textAnchor="middle" fontSize="11" fill="white">{tooltip.text}</text>
          </g>
        )}
      </svg>
      <p className="text-xs text-gray-400 mt-2 text-center">
        ※ 円の大きさ = 出願件数，線の太さ = 共同出願件数。上位{NETWORK_TOP_N}社を表示。ノードにマウスを当てると詳細が出ます。
      </p>
    </div>
  );
};

// ===== FI ランキングテーブル（日本語説明付き） =====
const FiRankingTable: React.FC<{
  fiData: Record<string, number>;
  accentColor: string;
  bgColor: string;
}> = ({ fiData, accentColor, bgColor }) => {
  const top = Object.entries(fiData).sort(([,a],[,b]) => b - a).slice(0, 10);
  const total = Object.values(fiData).reduce((a, b) => a + b, 0);
  const maxVal = top[0]?.[1] || 1;
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr style={{ backgroundColor: bgColor }}>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-10">順位</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">FIコード</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">技術分野（日本語）</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">件数</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">割合</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">バー</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {top.map(([code, count], i) => {
            const desc = getFiDescription(code);
            return (
              <tr key={code} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 text-gray-400 text-center font-mono">{i + 1}</td>
                <td className="px-3 py-2 font-mono font-semibold text-gray-800">{code}</td>
                <td className="px-3 py-2">
                  {desc
                    ? <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">{desc}</span>
                    : <span className="text-gray-300 text-xs">-</span>}
                </td>
                <td className="px-3 py-2 text-right font-bold" style={{ color: accentColor }}>{count.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-gray-600">{total > 0 ? ((count / total) * 100).toFixed(1) : 0}%</td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(count / maxVal) * 100}%`, backgroundColor: accentColor, opacity: 0.7 }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ===== データ解析ユーティリティ =====
const buildAnalysis = (data: any[], hdrs: string[]): AnalysisResults => {
  const applicantCol = hdrs.find(c => c && (c.includes('出願人') || c.includes('Applicant') || c.includes('権利者')));
  const fiCol = hdrs.find(c => c && (c.includes('FI') || c.includes('F-term') || c.includes('分類')));

  const yearCounts: Record<string, number> = {};
  data.forEach(row => { if (row.Year) yearCounts[row.Year] = (yearCounts[row.Year] || 0) + 1; });

  const leadingCompanies: Record<string, number> = {};
  const allCompanies: Record<string, number> = {};
  const cofilingMap: Record<string, number> = {};

  if (applicantCol) {
    data.forEach(row => {
      const val = row[applicantCol];
      if (!val) return;
      const companies = val.split(/[;,\n]/).map((c: string) => c.trim()).filter(Boolean);
      if (companies.length > 0) {
        leadingCompanies[companies[0]] = (leadingCompanies[companies[0]] || 0) + 1;
        companies.forEach((c: string) => { allCompanies[c] = (allCompanies[c] || 0) + 1; });
        for (let i = 0; i < companies.length; i++) {
          for (let j = i + 1; j < companies.length; j++) {
            const key = [companies[i], companies[j]].sort().join('|||');
            cofilingMap[key] = (cofilingMap[key] || 0) + 1;
          }
        }
      }
    });
  }

  const cofilingEdges = Object.entries(cofilingMap)
    .map(([key, count]) => { const [source, target] = key.split('|||'); return { source, target, count }; })
    .sort((a, b) => b.count - a.count).slice(0, 60);

  const leadingFIs: Record<string, number> = {};
  const allFIs: Record<string, number> = {};
  if (fiCol) {
    data.forEach(row => {
      const val = row[fiCol];
      if (!val) return;
      const codes = val.split(/[;,\n]/).map((c: string) => {
        const t = c.trim();
        return t.length > 6 ? t.substring(0, 6).replace(/[\/\-]$/, '') : t;
      }).filter(Boolean);
      if (codes.length > 0) {
        leadingFIs[codes[0]] = (leadingFIs[codes[0]] || 0) + 1;
        codes.forEach((c: string) => { allFIs[c] = (allFIs[c] || 0) + 1; });
      }
    });
  }

  const companyYearAnalysis: Record<string, Record<string, number>> = {};
  if (applicantCol) {
    data.forEach(row => {
      if (!row.Year || !row[applicantCol]) return;
      row[applicantCol].split(/[;,\n]/).map((c: string) => c.trim()).filter(Boolean).forEach((c: string) => {
        if (!companyYearAnalysis[c]) companyYearAnalysis[c] = {};
        companyYearAnalysis[c][row.Year] = (companyYearAnalysis[c][row.Year] || 0) + 1;
      });
    });
  }

  const fiYearAnalysis: Record<string, Record<string, number>> = {};
  if (fiCol) {
    data.forEach(row => {
      if (!row.Year || !row[fiCol]) return;
      row[fiCol].split(/[;,\n]/).map((c: string) => {
        const t = c.trim();
        return t.length > 6 ? t.substring(0, 6).replace(/[\/\-]$/, '') : t;
      }).filter(Boolean).forEach((c: string) => {
        if (!fiYearAnalysis[c]) fiYearAnalysis[c] = {};
        fiYearAnalysis[c][row.Year] = (fiYearAnalysis[c][row.Year] || 0) + 1;
      });
    });
  }

  return { yearCounts, leadingCompanies, allCompanies, leadingFIs, allFIs, companyYearAnalysis, fiYearAnalysis, cofilingEdges, hasApplicantData: !!applicantCol, hasFIData: !!fiCol };
};

// ===== タグ入力コンポーネント =====
const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: 'blue' | 'red';
}> = ({ tags, onChange, placeholder = 'Enterで追加...', color = 'blue' }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput('');
  };
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) onChange(tags.slice(0, -1));
  };
  const tagBg = color === 'red' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200';
  const ring = color === 'red' ? 'focus-within:ring-red-300 border-red-200' : 'focus-within:ring-blue-400 border-gray-300';
  return (
    <div className={`flex flex-wrap gap-1.5 items-center border rounded-lg px-2.5 py-1.5 min-h-[40px] cursor-text focus-within:ring-2 bg-white ${ring}`}
      onClick={() => inputRef.current?.focus()}>
      {tags.map(tag => (
        <span key={tag} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${tagBg}`}>
          {tag}
          <button type="button" onClick={e => { e.stopPropagation(); onChange(tags.filter(t => t !== tag)); }}
            className="hover:opacity-60 leading-none">×</button>
        </span>
      ))}
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-24 outline-none text-sm bg-transparent" />
    </div>
  );
};

// ===== メインアプリ =====
const PatentAnalysisApp: React.FC = () => {
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('charts');
  const [wordcloudImage, setWordcloudImage] = useState<string | null>(null);
  const [wcLoading, setWcLoading] = useState(false);
  const [wcIsFiltered, setWcIsFiltered] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableSearch, setTableSearch] = useState('');

  const EMPTY_FILTER: FilterConfig = {
    yearFrom:'', yearTo:'',
    companyKeywords:[], companyMode:'OR', companyExclude:[], selectedCompanies:[],
    fiKeywords:[], fiMode:'OR', fiExclude:[],
    titleKeywords:[], titleMode:'OR', titleExclude:[],
  };
  const [filters, setFilters] = useState<FilterConfig>(EMPTY_FILTER);
  const [appliedFilters, setAppliedFilters] = useState<FilterConfig>(EMPTY_FILTER);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const wrapText = (text: string, maxLength = 20) => {
    if (!text || text.length <= maxLength) return text;
    const words = text.split(/[\s\-\/・]/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + (cur ? ' ' : '') + w).length <= maxLength) { cur = cur ? cur + ' ' + w : w; }
      else {
        if (cur) { lines.push(cur); cur = w; }
        else { let ww = w; while (ww.length > maxLength) { lines.push(ww.substring(0, maxLength)); ww = ww.substring(maxLength); } cur = ww; }
      }
    }
    if (cur) lines.push(cur);
    return lines.join('\n');
  };

  const CustomYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }): React.ReactElement<SVGElement> => {
    const lines = String(payload.value).split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => <text key={i} x={0} y={i * 12 - (lines.length - 1) * 6} textAnchor="end" fill="#666" fontSize="11">{line}</text>)}
      </g>
    );
  };

  const generateWordcloud = async (source: File | any[]) => {
    setWcLoading(true); setWordcloudImage(null); setWcIsFiltered(false);
    try {
      let file: File;
      if (source instanceof File) {
        file = source;
      } else {
        // フィルター後データをCSV文字列 → Blobに変換してFileとして送信
        const csvStr = Papa.unparse(source, { header: true });
        const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
        file = new File([blob], 'filtered.csv', { type: 'text/csv' });
        setWcIsFiltered(true);
      }
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("https://python-word-cloud.onrender.com/generate-wordcloud", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) setWordcloudImage(data.image);
      else console.error("Wordcloud API error:", data);
    } catch (err) { console.error("Wordcloud fetch error:", err); }
    finally { setWcLoading(false); }
  };

  const parseYear = (dateStr: string): number | null => {
    if (!dateStr) return null;
    let date: Date;
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr))
      date = new Date(`${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`);
    else date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.getFullYear();
  };

  const processFile = (file: File) => {
    setSelectedFile(file); setLoading(true); setError(null); setWordcloudImage(null);
    setSortConfig(null); setCurrentPage(1); setTableSearch('');
    setCompanySearch('');
    Papa.parse(file, {
      complete: (results: any) => {
        try {
          const data = results.data;
          if (!data || data.length === 0) throw new Error('CSVファイルが空です');
          const hdrs = data[0] as string[];
          const dateCol = hdrs.find(c => c && (c.includes('出願日') || c.includes('Application Date') || c.includes('出願年月日')));
          if (!dateCol) throw new Error('出願日列が見つかりません。J-PlatPat形式であることを確認してください。');
          const processed = data.slice(1)
            .map((row: any) => { const obj: any = {}; hdrs.forEach((h, i) => { obj[h] = row[i] || ''; }); return obj; })
            .filter((row: any) => row[dateCol]);
          processed.forEach((row: any) => { const y = parseYear(row[dateCol]); if (y) row.Year = y; });
          setCsvData(processed); setHeaders(hdrs);
          setAnalysisResults(buildAnalysis(processed, hdrs));
          generateWordcloud(file);
        } catch (err: any) { setError(err?.message || "エラーが発生しました"); }
        finally { setLoading(false); }
      },
      header: false, skipEmptyLines: true, encoding: 'UTF-8', dynamicTyping: false, delimitersToGuess: [',', '\t', ';']
    });
  };

  // キーワードマッチングヘルパー
  const matchKeywords = (val: string, keywords: string[], mode: 'AND'|'OR', exclude: string[]): boolean => {
    const v = val?.toLowerCase() || '';
    const kws = keywords.map(k => k.toLowerCase()).filter(Boolean);
    const exs = exclude.map(k => k.toLowerCase()).filter(Boolean);
    if (exs.some(ex => v.includes(ex))) return false;
    if (kws.length === 0) return true;
    return mode === 'AND' ? kws.every(k => v.includes(k)) : kws.some(k => v.includes(k));
  };

  const filteredData = useMemo(() => {
    if (!csvData) return [];
    const applicantCol = headers.find(c => c && (c.includes('出願人') || c.includes('Applicant') || c.includes('権利者')));
    const fiCol = headers.find(c => c && (c.includes('FI') || c.includes('F-term') || c.includes('分類')));
    const titleCol = headers.find(c => c && (c.includes('発明の名称') || c.includes('Title') || c.includes('タイトル')));
    return csvData.filter(row => {
      if (appliedFilters.yearFrom && row.Year < parseInt(appliedFilters.yearFrom)) return false;
      if (appliedFilters.yearTo && row.Year > parseInt(appliedFilters.yearTo)) return false;
      if (applicantCol) {
        const companyVal = row[applicantCol] || '';
        // 会社ドロップダウン選択
        if (appliedFilters.selectedCompanies.length > 0) {
          const rowCompanies = companyVal.split(/[;,\n]/).map((c: string) => c.trim());
          if (!appliedFilters.selectedCompanies.some(sc => rowCompanies.includes(sc))) return false;
        }
        // キーワード
        if (!matchKeywords(companyVal, appliedFilters.companyKeywords, appliedFilters.companyMode, appliedFilters.companyExclude)) return false;
      }
      if (fiCol && !matchKeywords(row[fiCol] || '', appliedFilters.fiKeywords, appliedFilters.fiMode, appliedFilters.fiExclude)) return false;
      if (titleCol && !matchKeywords(row[titleCol] || '', appliedFilters.titleKeywords, appliedFilters.titleMode, appliedFilters.titleExclude)) return false;
      return true;
    });
  }, [csvData, headers, appliedFilters]);

  const filteredAnalysis = useMemo(() => {
    if (!csvData || !headers.length) return null;
    return buildAnalysis(filteredData, headers);
  }, [filteredData, headers, csvData]);

  const tableData = useMemo(() => {
    if (!csvData) return [];
    let data = [...csvData];
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      data = data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
    }
    if (sortConfig) {
      data.sort((a, b) => {
        const av = a[sortConfig.key] ?? '', bv = b[sortConfig.key] ?? '';
        const an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return sortConfig.direction === 'asc' ? an - bn : bn - an;
        const cmp = String(av).localeCompare(String(bv), 'ja');
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [csvData, tableSearch, sortConfig]);

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const pagedData = tableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const handleSort = (key: string) => {
    setSortConfig(prev => prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
    setCurrentPage(1);
  };

  const downloadCSV = useCallback((data: any[], filename: string, cols?: string[]) => {
    const columns = cols || (data.length > 0 ? Object.keys(data[0]) : []);
    const rows = [columns.join(','), ...data.map(row => columns.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadFilteredData = () => { if (filteredData.length) downloadCSV(filteredData, `patent_filtered_${Date.now()}.csv`, headers); };
  const downloadTableData = () => { if (tableData.length) downloadCSV(tableData, `patent_table_${Date.now()}.csv`, headers); };
  const downloadAggregated = (type: 'year' | 'company' | 'fi' | 'cofiling') => {
    if (!filteredAnalysis) return;
    if (type === 'year') downloadCSV(Object.entries(filteredAnalysis.yearCounts).sort(([a],[b]) => parseInt(a)-parseInt(b)).map(([年,件数]) => ({年,件数})), `patent_year_${Date.now()}.csv`);
    else if (type === 'company') downloadCSV(Object.entries(filteredAnalysis.allCompanies).sort(([,a],[,b]) => b-a).map(([出願人,件数]) => ({出願人,件数})), `patent_company_${Date.now()}.csv`);
    else if (type === 'fi') downloadCSV(Object.entries(filteredAnalysis.allFIs).sort(([,a],[,b]) => b-a).map(([FIコード,件数]) => ({FIコード, 技術分野: getFiDescription(FIコード), 件数})), `patent_fi_${Date.now()}.csv`);
    else downloadCSV(filteredAnalysis.cofilingEdges.map(({ source, target, count }) => ({出願人A:source, 出願人B:target, 共同出願件数:count})), `patent_cofiling_${Date.now()}.csv`);
  };

  const getTopN = (data: Record<string, number>, n = 10) =>
    Object.entries(data).sort(([,a],[,b]) => b-a).slice(0, n).map(([name,value]) => ({ name: wrapText(name, 25), originalName: name, value }));
  const getYearData = (data: Record<string, number>) =>
    Object.entries(data).sort(([a],[b]) => parseInt(a)-parseInt(b)).map(([year,count]) => ({ year: parseInt(year), count }));
  const getTimeSeriesData = (yearAnalysis: Record<string, Record<string, number>>, topItems: any[]) => {
    const years = [...new Set(Object.values(yearAnalysis).flatMap(obj => Object.keys(obj)))].sort((a,b) => parseInt(a)-parseInt(b));
    return years.map(year => {
      const dp: any = { year: parseInt(year) };
      topItems.forEach(item => { dp[item.originalName || item.name] = yearAnalysis[item.originalName || item.name]?.[year] || 0; });
      return dp;
    });
  };

  const activeFiltersCount = [
    appliedFilters.yearFrom, appliedFilters.yearTo,
    appliedFilters.companyKeywords.length > 0 ? '1' : '',
    appliedFilters.companyExclude.length > 0 ? '1' : '',
    appliedFilters.selectedCompanies.length > 0 ? '1' : '',
    appliedFilters.fiKeywords.length > 0 ? '1' : '',
    appliedFilters.fiExclude.length > 0 ? '1' : '',
    appliedFilters.titleKeywords.length > 0 ? '1' : '',
    appliedFilters.titleExclude.length > 0 ? '1' : '',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">

        {/* ヘッダー */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">J-PlatPat特許データ解析システム</h1>
          <p className="text-center text-gray-600 mb-8">J-PlatPatのCSVファイルから特許データを解析し、包括的なレポートを生成します</p>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 cursor-pointer transition-all duration-200 ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={e => {
              e.preventDefault(); setIsDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) processFile(file);
              else setError('CSVファイルのみアップロード可能です');
            }}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">{isDragOver ? 'ファイルをドロップしてください' : 'J-PlatPatのCSVファイルを選択またはドラッグ&ドロップしてください'}</div>
            <div className="text-sm text-gray-500">クリックしてファイルを選択するか、ここにファイルをドラッグしてください</div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
            {selectedFile && <p className="mt-4 text-sm text-gray-600 bg-gray-100 rounded px-3 py-2 inline-block">選択されたファイル: {selectedFile.name}</p>}
          </div>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div><p className="mt-4 text-gray-600">処理中...</p></div>}
        </div>

        {/* 概要 */}
        {analysisResults && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">解析結果の概要</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">総レコード数</h3>
                <p className="text-2xl font-bold text-blue-600">{csvData?.length || 0}</p>
                {activeFiltersCount > 0 && <p className="text-sm text-blue-500">フィルター後: {filteredData.length}</p>}
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">解析期間</h3>
                <p className="text-lg font-bold text-green-600">
                  {filteredAnalysis && Object.keys(filteredAnalysis.yearCounts).length > 0
                    ? `${Math.min(...Object.keys(filteredAnalysis.yearCounts).map(Number))} - ${Math.max(...Object.keys(filteredAnalysis.yearCounts).map(Number))}`
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">企業数</h3>
                <p className="text-2xl font-bold text-purple-600">{analysisResults.hasApplicantData ? Object.keys(filteredAnalysis?.allCompanies || {}).length : 'N/A'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800">分類コード数</h3>
                <p className="text-2xl font-bold text-orange-600">{analysisResults.hasFIData ? Object.keys(filteredAnalysis?.allFIs || {}).length : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* タブ */}
        {analysisResults && (
          <div className="mb-6 flex gap-2">
            <button onClick={() => setActiveTab('charts')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'charts' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 shadow'}`}>
              <BarChart3 className="h-5 w-5" />グラフ分析
            </button>
            <button onClick={() => setActiveTab('table')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 shadow'}`}>
              <Table className="h-5 w-5" />データテーブル
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{csvData?.length}</span>
            </button>
          </div>
        )}

        {/* ===== グラフタブ ===== */}
        {analysisResults && activeTab === 'charts' && (
          <>
            {/* ワードクラウド */}
            {(wcLoading || wordcloudImage) && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span>☁️</span>ワードクラウド（発明の名称）
                    {wordcloudImage && !wcLoading && (
                      <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${wcIsFiltered ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {wcIsFiltered ? `フィルター後 ${filteredData.length}件` : `全データ ${csvData?.length}件`}
                      </span>
                    )}
                  </h2>
                  {wordcloudImage && !wcLoading && activeFiltersCount > 0 && !wcIsFiltered && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                        ⚠ フィルター適用中 — 全データで生成されています
                      </span>
                      <button
                        onClick={() => generateWordcloud(filteredData)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        ☁️ フィルター後で再生成
                      </button>
                    </div>
                  )}
                  {wordcloudImage && !wcLoading && activeFiltersCount > 0 && wcIsFiltered && (
                    <button
                      onClick={() => selectedFile && generateWordcloud(selectedFile)}
                      className="text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      全データに戻す
                    </button>
                  )}
                </div>
                {wcLoading && <div className="text-center py-6"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div><p className="mt-2 text-gray-600">ワードクラウドを生成しています...</p></div>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {wordcloudImage && <img src={wordcloudImage} alt="Word Cloud" className="mx-auto rounded-lg shadow-md max-w-full" />}
              </div>
            )}

            {/* フィルター */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-gray-700 font-semibold hover:text-blue-600 transition-colors">
                  <Filter className="h-5 w-5" />フィルター条件
                  {activeFiltersCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>}
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <div className="relative group">
                  <button className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                    <Download className="h-4 w-4" />CSVダウンロード
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-lg border z-10 hidden group-hover:block w-56">
                    <button onClick={downloadFilteredData} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b">フィルター後の生データ</button>
                    <button onClick={() => downloadAggregated('year')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b">年別集計データ</button>
                    <button onClick={() => downloadAggregated('company')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b">会社別集計データ</button>
                    <button onClick={() => downloadAggregated('fi')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b">FIコード別集計（日本語付き）</button>
                    <button onClick={() => downloadAggregated('cofiling')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">共同出願ペアデータ</button>
                  </div>
                </div>
              </div>
              {showFilters && (
                <div className="border-t pt-4 mt-4 space-y-5">

                  {/* 出願年スライダー */}
                  {(() => {
                    const years = csvData ? [...new Set(csvData.map((r: any) => r.Year).filter(Boolean))].sort((a: number, b: number) => a - b) : [];
                    const minY = years[0] ?? 2000;
                    const maxY = years[years.length - 1] ?? new Date().getFullYear();
                    return (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📅 出願年範囲</label>
                        <div className="flex items-center gap-3">
                          <input type="number" placeholder={String(minY)} value={filters.yearFrom}
                            onChange={e => setFilters(f => ({ ...f, yearFrom: e.target.value }))}
                            className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          <span className="text-gray-400">〜</span>
                          <input type="number" placeholder={String(maxY)} value={filters.yearTo}
                            onChange={e => setFilters(f => ({ ...f, yearTo: e.target.value }))}
                            className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          <span className="text-xs text-gray-400">（データ範囲: {minY}〜{maxY}年）</span>
                        </div>
                        {years.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {[5, 10, 20].map(n => {
                              const from = maxY - n + 1;
                              return <button key={n} onClick={() => setFilters(f => ({ ...f, yearFrom: String(from), yearTo: String(maxY) }))} className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded border transition-colors">直近{n}年</button>;
                            })}
                            <button onClick={() => setFilters(f => ({ ...f, yearFrom: '', yearTo: '' }))} className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded border">全期間</button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 会社名フィルター */}
                  {analysisResults?.hasApplicantData && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 出願人フィルター</label>
                      {/* ドロップダウン複数選択 */}
                      <div className="mb-2 relative">
                        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-400 min-h-[40px] flex-wrap gap-1"
                          onClick={() => setShowCompanyDropdown(true)}>
                          {filters.selectedCompanies.map(c => (
                            <span key={c} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {c.length > 20 ? c.substring(0,20)+'…' : c}
                              <button onClick={e => { e.stopPropagation(); setFilters(f => ({ ...f, selectedCompanies: f.selectedCompanies.filter(x => x !== c) })); }} className="hover:text-red-500">×</button>
                            </span>
                          ))}
                          <input
                            type="text" placeholder={filters.selectedCompanies.length === 0 ? "会社名で絞り込み（リストから選択）..." : "追加..."}
                            value={companySearch}
                            onChange={e => { setCompanySearch(e.target.value); setShowCompanyDropdown(true); }}
                            onFocus={() => setShowCompanyDropdown(true)}
                            className="flex-1 min-w-32 outline-none text-sm bg-transparent"
                          />
                        </div>
                        {showCompanyDropdown && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {(() => {
                              const allC = Object.entries(filteredAnalysis?.allCompanies || {})
                                .sort(([,a],[,b]) => b-a)
                                .filter(([name]) => !companySearch || name.toLowerCase().includes(companySearch.toLowerCase()))
                                .slice(0, 50);
                              if (allC.length === 0) return <div className="px-3 py-2 text-sm text-gray-400">該当なし</div>;
                              return allC.map(([name, count]) => (
                                <button key={name} onClick={() => {
                                  if (!filters.selectedCompanies.includes(name)) setFilters(f => ({ ...f, selectedCompanies: [...f.selectedCompanies, name] }));
                                  setCompanySearch(''); setShowCompanyDropdown(false);
                                }} className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors ${filters.selectedCompanies.includes(name) ? 'bg-blue-50 text-blue-700' : ''}`}>
                                  <span className="font-medium">{name}</span>
                                  <span className="ml-2 text-xs text-gray-400">{count}件</span>
                                </button>
                              ));
                            })()}
                            <button onClick={() => setShowCompanyDropdown(false)} className="block w-full text-center px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 border-t">閉じる</button>
                          </div>
                        )}
                      </div>
                      {/* キーワード＋AND/OR */}
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <TagInput tags={filters.companyKeywords} onChange={tags => setFilters(f => ({ ...f, companyKeywords: tags }))}
                            placeholder="Enterで追加 例: トヨタ" color="blue" />
                        </div>
                        <select value={filters.companyMode} onChange={e => setFilters(f => ({ ...f, companyMode: e.target.value as 'AND'|'OR' }))}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                          <option value="OR">OR（いずれか）</option>
                          <option value="AND">AND（すべて含む）</option>
                        </select>
                      </div>
                      <div className="mt-1.5">
                        <TagInput tags={filters.companyExclude} onChange={tags => setFilters(f => ({ ...f, companyExclude: tags }))}
                          placeholder="除外キーワードをEnterで追加 例: 大学" color="red" />
                      </div>
                    </div>
                  )}

                  {/* FIコードフィルター */}
                  {analysisResults?.hasFIData && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">🔬 FIコードフィルター</label>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <TagInput tags={filters.fiKeywords} onChange={tags => setFilters(f => ({ ...f, fiKeywords: tags }))}
                            placeholder="Enterで追加 例: H01L" color="blue" />
                        </div>
                        <select value={filters.fiMode} onChange={e => setFilters(f => ({ ...f, fiMode: e.target.value as 'AND'|'OR' }))}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                          <option value="OR">OR</option>
                          <option value="AND">AND</option>
                        </select>
                      </div>
                      <div className="mt-1.5">
                        <TagInput tags={filters.fiExclude} onChange={tags => setFilters(f => ({ ...f, fiExclude: tags }))}
                          placeholder="除外FIコードをEnterで追加" color="red" />
                      </div>
                    </div>
                  )}

                  {/* 発明の名称フィルター */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">💡 発明の名称フィルター</label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <TagInput tags={filters.titleKeywords} onChange={tags => setFilters(f => ({ ...f, titleKeywords: tags }))}
                          placeholder="Enterで追加 例: 半導体" color="blue" />
                      </div>
                      <select value={filters.titleMode} onChange={e => setFilters(f => ({ ...f, titleMode: e.target.value as 'AND'|'OR' }))}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        <option value="OR">OR</option>
                        <option value="AND">AND</option>
                      </select>
                    </div>
                    <div className="mt-1.5">
                      <TagInput tags={filters.titleExclude} onChange={tags => setFilters(f => ({ ...f, titleExclude: tags }))}
                        placeholder="除外キーワードをEnterで追加" color="red" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => { setAppliedFilters({ ...filters }); setShowCompanyDropdown(false); }} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">フィルターを適用</button>
                    <button onClick={() => { setFilters(EMPTY_FILTER); setAppliedFilters(EMPTY_FILTER); setCompanySearch(''); }} className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"><X className="h-4 w-4" />すべてクリア</button>
                  </div>
                  {activeFiltersCount > 0 && <p className="text-sm text-blue-600">フィルター適用中: 全{csvData?.length}件 → <span className="font-bold">{filteredData.length}件</span></p>}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* 年次推移 */}
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['year'] = el; }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-blue-600" />出願件数の推移</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getYearData(filteredAnalysis?.yearCounts || {})}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Legend />
                    <Line type="linear" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 共同出願ネットワーク */}
              {filteredAnalysis?.hasApplicantData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['cofiling'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center"><Share2 className="mr-2 h-6 w-6 text-teal-600" />共同出願ネットワーク</h2>
                  <p className="text-sm text-gray-500 mb-4">同一出願で複数の出願人が記載されているケースを可視化します。円の大きさ＝出願件数，線の太さ＝共同出願件数。</p>
                  <CofilingNetwork edges={filteredAnalysis.cofilingEdges} allCompanies={filteredAnalysis.allCompanies} />
                  {filteredAnalysis.cofilingEdges.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">共同出願ペア ランキング</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-teal-50">
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-10">順位</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">出願人 A</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">出願人 B</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">共同出願件数</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredAnalysis.cofilingEdges.slice(0, 10).map((e, i) => (
                              <tr key={i} className="hover:bg-teal-50 transition-colors">
                                <td className="px-3 py-2 text-gray-400 text-center">{i + 1}</td>
                                <td className="px-3 py-2 text-gray-800 font-medium">{e.source}</td>
                                <td className="px-3 py-2 text-gray-800 font-medium">{e.target}</td>
                                <td className="px-3 py-2 text-right font-bold text-teal-600">{e.count.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 筆頭会社 TOP10 */}
              {filteredAnalysis?.hasApplicantData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['leading-co'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-yellow-600" />筆頭会社トップ10</h2>
                  <ResponsiveContainer width="100%" height={550}>
                    <BarChart data={getTopN(filteredAnalysis.leadingCompanies, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={300} tick={CustomYAxisTick} interval={0} />
                      <Tooltip formatter={(v: any, _n: string, p: any) => [v, p.payload.originalName]} />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 全会社 TOP10 */}
              {filteredAnalysis?.hasApplicantData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['all-co'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-blue-600" />全体会社トップ10</h2>
                  <ResponsiveContainer width="100%" height={550}>
                    <BarChart data={getTopN(filteredAnalysis.allCompanies, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={300} tick={CustomYAxisTick} interval={0} />
                      <Tooltip formatter={(v: any, _n: string, p: any) => [v, p.payload.originalName]} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 筆頭会社 円グラフ */}
              {filteredAnalysis?.hasApplicantData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['pie'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Target className="mr-2 h-6 w-6 text-purple-600" />筆頭会社の割合</h2>
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                      <Pie data={getTopN(filteredAnalysis.leadingCompanies, 10)} cx="50%" cy="50%" outerRadius={150} dataKey="value"
                        label={(e: any) => `${wrapText(e.originalName, 15)} ${(e.percent * 100).toFixed(1)}%`}>
                        {getTopN(filteredAnalysis.leadingCompanies, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, _n: string, p: any) => [v, p.payload.originalName]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 筆頭FI TOP10 + テーブル */}
              {filteredAnalysis?.hasFIData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['leading-fi'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-red-600" />筆頭分類コードトップ10</h2>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={getTopN(filteredAnalysis.leadingFIs, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(v: any, _n: string, p: any) => [v, p.payload.originalName]} />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                  <FiRankingTable fiData={filteredAnalysis.leadingFIs} accentColor="#ef4444" bgColor="#fef2f2" />
                </div>
              )}

              {/* 全FI TOP10 + テーブル */}
              {filteredAnalysis?.hasFIData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['all-fi'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-indigo-600" />全分類コードトップ10</h2>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={getTopN(filteredAnalysis.allFIs, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(v: any, _n: string, p: any) => [v, p.payload.originalName]} />
                      <Bar dataKey="value" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                  <FiRankingTable fiData={filteredAnalysis.allFIs} accentColor="#6366f1" bgColor="#eef2ff" />
                </div>
              )}

              {/* 会社別時系列 */}
              {filteredAnalysis?.hasApplicantData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['co-ts'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-green-600" />会社別出願件数の時系列分析</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={getTimeSeriesData(filteredAnalysis.companyYearAnalysis, getTopN(filteredAnalysis.allCompanies, 5))}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Legend />
                      {getTopN(filteredAnalysis.allCompanies, 5).map((c, i) => (
                        <Line key={c.originalName} type="linear" dataKey={c.originalName} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={c.originalName} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* FI別時系列 */}
              {filteredAnalysis?.hasFIData && (
                <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['fi-ts'] = el; }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-purple-600" />分類コード別出願件数の時系列分析</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={getTimeSeriesData(filteredAnalysis.fiYearAnalysis, getTopN(filteredAnalysis.allFIs, 5))}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Legend />
                      {getTopN(filteredAnalysis.allFIs, 5).map((fi, i) => (
                        <Line key={fi.originalName} type="linear" dataKey={fi.originalName} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={fi.originalName} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== データテーブルタブ ===== */}
        {analysisResults && activeTab === 'table' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="全列を横断検索..." value={tableSearch}
                    onChange={e => { setTableSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  {tableSearch && <button onClick={() => { setTableSearch(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">{tableData.length}件 / {csvData?.length}件</span>
              </div>
              <button onClick={downloadTableData} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 whitespace-nowrap">
                <Download className="h-4 w-4" />このデータをCSV出力
              </button>
            </div>
            {sortConfig && (
              <div className="mb-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <span>ソート中: <strong>{sortConfig.key}</strong> {sortConfig.direction === 'asc' ? '▲ 昇順' : '▼ 降順'}</span>
                <button onClick={() => setSortConfig(null)} className="ml-auto text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">#</th>
                    {headers.map(h => (
                      <th key={h} onClick={() => handleSort(h)}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition-colors whitespace-nowrap select-none">
                        <span className="flex items-center gap-1">
                          {h}
                          {sortConfig?.key === h && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 text-blue-600" /> : <ChevronDown className="h-3 w-3 text-blue-600" />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedData.length === 0
                    ? <tr><td colSpan={headers.length + 1} className="text-center py-12 text-gray-400">データが見つかりません</td></tr>
                    : pagedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-gray-400 text-xs">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                        {headers.map(h => <td key={h} className="px-3 py-2 text-gray-700 max-w-xs truncate" title={String(row[h] || '')}>{String(row[h] || '')}</td>)}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <span className="text-sm text-gray-500">{(currentPage-1)*PAGE_SIZE+1}〜{Math.min(currentPage*PAGE_SIZE, tableData.length)} / {tableData.length}件</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage===1} className="px-2 py-1 rounded text-sm border disabled:opacity-40 hover:bg-gray-50">«</button>
                  <button onClick={() => setCurrentPage(p => p-1)} disabled={currentPage===1} className="px-3 py-1 rounded text-sm border disabled:opacity-40 hover:bg-gray-50">前へ</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded text-sm border ${page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>{page}</button>;
                  })}
                  <button onClick={() => setCurrentPage(p => p+1)} disabled={currentPage===totalPages} className="px-3 py-1 rounded text-sm border disabled:opacity-40 hover:bg-gray-50">次へ</button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage===totalPages} className="px-2 py-1 rounded text-sm border disabled:opacity-40 hover:bg-gray-50">»</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatentAnalysisApp;