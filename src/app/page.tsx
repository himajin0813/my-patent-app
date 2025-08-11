import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, FileText, Calendar } from 'lucide-react';

// 縦軸ラベル用カスタムコンポーネント（改行対応）
const CustomYAxisTick = ({ x, y, payload }) => {
  const lines = payload.value.split('\n');
  return (
    <text x={x} y={y} dy={3} textAnchor="end" fill="#374151" fontSize={12}>
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

// ラベル折り返し関数
const wrapText = (text, maxChars) => {
  const regex = new RegExp(`.{1,${maxChars}}`, 'g');
  return text.match(regex)?.join('\n') || text;
};

export default function App() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const chartRefs = useRef({});

  // CSVファイル選択時の処理
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        processData(results.data);
      },
      error: (err) => {
        console.error('CSV parsing error:', err);
      },
    });
  };

  // CSVデータ集計
  const processData = (data) => {
    const companies = {};
    const fiCodes = {};
    const timeline = {};

    data.forEach((row) => {
      const companyName = row['Company Name'] || '';
      const fiCode = row['FI Code'] || '';
      const date = row['Date'] || '';

      if (companyName) companies[companyName] = (companies[companyName] || 0) + 1;
      if (fiCode) fiCodes[fiCode] = (fiCodes[fiCode] || 0) + 1;
      if (date) timeline[date] = (timeline[date] || 0) + 1;
    });

    setAnalysisResults({
      hasApplicantData: data.length > 0,
      companies,
      fiCodes,
      timeline,
      allCompanies: companies,
    });
  };

  // 上位N件を抽出
  const getTopN = (obj, n) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, value]) => ({
        name: wrapText(name, 10),
        value,
        originalName: name,
      }));

  return (
    <div className="p-6 space-y-6">
      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {/* 全会社トップ10 */}
      {analysisResults?.hasApplicantData && (
        <div
          className="bg-white rounded-xl shadow-lg p-6"
          ref={(el) => (chartRefs.current['all-companies'] = el)}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 h-6 w-6 text-blue-600" />
            全体会社トップ10
          </h2>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              data={getTopN(analysisResults.allCompanies, 10)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={300}
                tick={<CustomYAxisTick />}
                interval={0}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  value,
                  props.payload.originalName,
                ]}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* FIコードトップ10 */}
      {analysisResults?.hasApplicantData && (
        <div
          className="bg-white rounded-xl shadow-lg p-6"
          ref={(el) => (chartRefs.current['fi-codes'] = el)}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <FileText className="mr-2 h-6 w-6 text-green-600" />
            FIコードトップ10
          </h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={getTopN(analysisResults.fiCodes, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={<CustomYAxisTick />}
                interval={0}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 時系列推移 */}
      {analysisResults?.hasApplicantData && (
        <div
          className="bg-white rounded-xl shadow-lg p-6"
          ref={(el) => (chartRefs.current['timeline'] = el)}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2 h-6 w-6 text-purple-600" />
            応募数の時系列推移
          </h2>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={Object.entries(analysisResults.timeline)
                .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                .map(([date, count]) => ({ date, count }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
