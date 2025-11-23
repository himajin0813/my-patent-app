"use client";
import { BarChart3, Target, TrendingUp, Upload } from 'lucide-react';
import Papa from 'papaparse';
import React, { useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type AnalysisResults = {
  yearCounts: Record<string, number>;
  leadingCompanies: Record<string, number>;
  allCompanies: Record<string, number>;
  leadingFIs: Record<string, number>;
  allFIs: Record<string, number>;
  companyYearAnalysis: Record<string, Record<string, number>>;
  fiYearAnalysis: Record<string, Record<string, number>>;
  hasApplicantData: boolean;
  hasFIData: boolean;
};

const PatentAnalysisApp: React.FC = () => {
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ワードクラウド用ステート
  const [wordcloudImage, setWordcloudImage] = useState<string | null>(null);
  const [wcLoading, setWcLoading] = useState(false);

  // 社名を折り返し表示する関数
  const wrapText = (text: string, maxLength = 20) => {
    if (!text || text.length <= maxLength) return text;
    
    const words = text.split(/[\s\-\/・]/);
    const lines: string[] = [];
    let currentLine = '';
    
    for (let word of words) {
      if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // 単語が長すぎる場合は強制的に分割
          while (word.length > maxLength) {
            lines.push(word.substring(0, maxLength));
            word = word.substring(maxLength);
          }
          currentLine = word;
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  };

  // カスタムY軸ティックコンポーネント
  const CustomYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }): React.ReactElement<SVGElement> => {
    const lines = String(payload.value).split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={index * 12 - (lines.length - 1) * 6}
            dy={0}
            textAnchor="end"
            fill="#666"
            fontSize="11"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  // --- ワードクラウド生成用 API 呼び出し ---
  const generateWordcloud = async (file: File) => {
    console.log("generateWordcloud");
    setWcLoading(true);
    setWordcloudImage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://python-word-cloud.onrender.com/generate-wordcloud", {
        method: "POST",
        body: formData,
      });

      // 応答の JSON をパース
      const data = await res.json();
      console.log(data);

      if (res.ok && data.success) { 
        setWordcloudImage(data.image); // data:image/png;base64,... をそのままセット
      } else {
        // APIが400/500などを返した場合のエラーメッセージ処理
        const msg = data?.error || "ワードクラウド生成に失敗しました";
        setError(msg);
        console.error("Wordcloud API error:", data);
      }
    } catch (err) {
      console.error("Wordcloud fetch error:", err);
      setError("ワードクラウド生成中に通信エラーが発生しました");
    } finally {
      setWcLoading(false);
    }
  };

  // CSVファイルの読み込み
  const processFile = (file: File) => {
    setSelectedFile(file);
    setLoading(true);
    setError(null);
    setWordcloudImage(null);

    Papa.parse(file, {
      complete: (results: any) => {
        try {
          const data = results.data;
          if (!data || data.length === 0) {
            throw new Error('CSVファイルが空です');
          }
          
          // ヘッダーを取得（J-PlatPat形式）
          const headers = data[0] as any;
          // J-PlatPatの主要な列名を検索（ヘッダー文字列そのものを利用する実装のため、header:falseで読み込んでいる）
          const applicationDateColumn = headers.find((col: string) => 
            col && (col.includes('出願日') || col.includes('Application Date') || col.includes('出願年月日'))
          );
          const applicantColumn = headers.find((col: string) => 
            col && (col.includes('出願人') || col.includes('Applicant') || col.includes('権利者'))
          );
          const fiColumn = headers.find((col: string) => 
            col && (col.includes('FI') || col.includes('F-term') || col.includes('分類'))
          );

          console.log('Found columns:', { applicationDateColumn, applicantColumn, fiColumn });

          if (!applicationDateColumn) {
            throw new Error('出願日列が見つかりません。CSVファイルがJ-PlatPat形式であることを確認してください。');
          }

          // データをオブジェクト配列に変換（ヘッダー行をキーにする）
          const processedData = data.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header: any, headerIndex: number) => {
              obj[header] = row[headerIndex] || '';
            });
            return obj;
          }).filter((row: any) => row[applicationDateColumn]);

          // 年を追加
          processedData.forEach((row: any) => {
            const dateStr = row[applicationDateColumn];
            let date: Date;
            if (typeof dateStr !== 'string') {
              date = new Date(String(dateStr));
            } else if (dateStr.includes('/')) {
              date = new Date(dateStr);
            } else if (dateStr.includes('-')) {
              date = new Date(dateStr);
            } else if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              date = new Date(`${year}-${month}-${day}`);
            } else {
              date = new Date(dateStr);
            }
            
            if (!isNaN(date.getTime())) {
              row.Year = date.getFullYear();
            }
          });

          setCsvData(processedData);
          analyzeData(processedData, headers);

          console.log("processedData", processedData);

          // 発明の名称列に限定してワードクラウドを生成（FastAPIにファイルを送る）
          generateWordcloud(file);
        } catch (err: any) {
          setError(err?.message || "エラーが発生しました");
          console.error('Error processing CSV:', err);
        } finally {
          setLoading(false);
        }
      },
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      dynamicTyping: false,
      delimitersToGuess: [',', '\t', ';']
    });
  };

  // ファイル入力からのアップロード処理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        setError('CSVファイルのみアップロード可能です');
      }
    }
  };

  // アップロードエリアクリック
  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // データ解析（既存ロジック）
  const analyzeData = (data: any, headers: any) => {
    try {
      const applicantColumn = headers.find((col: string) => 
        col && (col.includes('出願人') || col.includes('Applicant') || col.includes('権利者'))
      );
      const fiColumn = headers.find((col: string) => 
        col && (col.includes('FI') || col.includes('F-term') || col.includes('分類'))
      );

      const yearCounts: Record<string, number> = {};
      data.forEach((row: any) => {
        if (row.Year) {
          yearCounts[row.Year] = (yearCounts[row.Year] || 0) + 1;
        }
      });

      const leadingCompanies: Record<string, number> = {};
      const allCompanies: Record<string, number> = {};
      
      if (applicantColumn) {
        data.forEach((row: any) => {
          const applicant = row[applicantColumn];
          if (applicant) {
            const companies = applicant.split(/[;,\n]/).map((c: string) => c.trim()).filter((c: string) => c);
            if (companies.length > 0) {
              const leadingCompany = companies[0];
              leadingCompanies[leadingCompany] = (leadingCompanies[leadingCompany] || 0) + 1;
              companies.forEach((company: any) => {
                allCompanies[company] = (allCompanies[company] || 0) + 1;
              });
            }
          }
        });
      }

      const leadingFIs: Record<string, number> = {};
      const allFIs: Record<string, number> = {};
      
      if (fiColumn) {
        data.forEach((row: any) => {
          const fi = row[fiColumn];
          if (fi) {
            const fiCodes = fi.split(/[;,\n]/).map((code: string) => {
              const trimmed = code.trim();
              return trimmed.length > 6 ? trimmed.substring(0, 6).replace(/[\/\-]$/, '') : trimmed;
            }).filter((code: string) => code);
            
            if (fiCodes.length > 0) {
              const leadingFI = fiCodes[0];
              if (leadingFI) {
                leadingFIs[leadingFI] = (leadingFIs[leadingFI] || 0) + 1;
              }
              fiCodes.forEach((code: string) => {
                if (code) {
                  allFIs[code] = (allFIs[code] || 0) + 1;
                }
              });
            }
          }
        });
      }

      const companyYearAnalysis: Record<string, Record<string, number>> = {};
      if (applicantColumn) {
        data.forEach((row: any) => {
          if (row.Year && row[applicantColumn]) {
            const companies = row[applicantColumn].split(/[;,\n]/).map((c: any) => c.trim()).filter((c: any) => c);
            companies.forEach((company: string) => {
              if (!companyYearAnalysis[company]) {
                companyYearAnalysis[company] = {};
              }
              companyYearAnalysis[company][row.Year] = (companyYearAnalysis[company][row.Year] || 0) + 1;
            });
          }
        });
      }

      const fiYearAnalysis: Record<string, Record<string, number>> = {};
      if (fiColumn) {
        data.forEach((row: any) => {
          if (row.Year && row[fiColumn]) {
            const fiCodes = row[fiColumn].split(/[;,\n]/).map((code: string) => {
              const trimmed = code.trim();
              return trimmed.length > 6 ? trimmed.substring(0, 6).replace(/[\/\-]$/, '') : trimmed;
            }).filter((code: string) => code);
            
            fiCodes.forEach((code: string) => {
              if (code) {
                if (!fiYearAnalysis[code]) {
                  fiYearAnalysis[code] = {};
                }
                fiYearAnalysis[code][row.Year] = (fiYearAnalysis[code][row.Year] || 0) + 1;
              }
            });
          }
        });
      }

      setAnalysisResults({
        yearCounts,
        leadingCompanies,
        allCompanies,
        leadingFIs,
        allFIs,
        companyYearAnalysis,
        fiYearAnalysis,
        hasApplicantData: !!applicantColumn,
        hasFIData: !!fiColumn
      });
    } catch (err: any) {
      setError('データ解析中にエラーが発生しました: ' + err?.message);
      console.error('Analysis error:', err);
    }
  };

  // トップNデータを取得（社名を折り返しで表示）
  const getTopN = (data: Record<string, number>, n = 10) => {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([name, value]) => ({
        name: wrapText(name, 25),
        originalName: name,
        value,
      }));
  };

  // 年次データを取得
  const getYearData = (data: Record<string, number>) => {
    return Object.entries(data)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, count]) => ({ year: parseInt(year), count }));
  };

  // 時系列データを取得
  const getTimeSeriesData = (yearAnalysis: Record<string, Record<string, number>>, topItems: any[]) => {
    const years = [...new Set(
      Object.values(yearAnalysis).flatMap((obj: any) => Object.keys(obj))
    )].sort((a, b) => parseInt(a) - parseInt(b));
        
    return years.map(year => {
      const dataPoint: any = { year: parseInt(year) };
      topItems.forEach((item: any) => {
        dataPoint[item.originalName || item.name] = yearAnalysis[item.originalName || item.name]?.[year] || 0;
      });
      return dataPoint;
    });
  };

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">J-PlatPat特許データ解析システム</h1>
          <p className="text-center text-gray-600 mb-8">J-PlatPatのCSVファイルから特許データを解析し、包括的なレポートを生成します</p>
          
          {/* ファイルアップロード */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 cursor-pointer transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onClick={handleUploadAreaClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">
              {isDragOver ? 'ファイルをドロップしてください' : 'J-PlatPatのCSVファイルを選択またはドラッグ&ドロップしてください'}
            </div>
            <div className="text-sm text-gray-500">
              クリックしてファイルを選択するか、ここにファイルをドラッグしてください
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            {selectedFile && (
              <p className="mt-4 text-sm text-gray-600 bg-gray-100 rounded px-3 py-2 inline-block">
                選択されたファイル: {selectedFile?.name}
              </p>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* ローディング */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">処理中...</p>
            </div>
          )}

          {/* ワードクラウド生成状態 */}
          <div className="mt-4">
            {wcLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">ワードクラウドを生成しています...</p>
              </div>
            )}

            {wordcloudImage && (
              <div className="mt-6 text-center">
                <h2 className="text-lg font-semibold mb-2">ワードクラウド（発明の名称）</h2>
                <img src={wordcloudImage} alt="Word Cloud" className="mx-auto rounded-lg shadow-md max-w-full" />
              </div>
            )}
          </div>
        </div>

        {/* 分析結果の概要 */}
        {analysisResults && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">解析結果の概要</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">総レコード数</h3>
                <p className="text-2xl font-bold text-blue-600">{csvData?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">解析期間</h3>
                <p className="text-lg font-bold text-green-600">
                  {analysisResults.yearCounts && Object.keys(analysisResults.yearCounts).length > 0
                    ? `${Math.min(...Object.keys(analysisResults.yearCounts).map(Number))} - ${Math.max(...Object.keys(analysisResults.yearCounts).map(Number))}`
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">企業数</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {analysisResults.hasApplicantData ? Object.keys(analysisResults.allCompanies || {}).length : 'N/A'}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800">分類コード数</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {analysisResults.hasFIData ? Object.keys(analysisResults.allFIs || {}).length : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 分析結果 */}
        {analysisResults && (
          <div className="space-y-8">
            {/* 年次出願件数推移 */}
            <div className="bg-white rounded-xl shadow-lg p-6" ref={el => {
                chartRefs.current['year-trend'] = el;
              }}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-blue-600" />
                出願件数の推移
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getYearData(analysisResults.yearCounts)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="linear" 
                    dataKey="count" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 筆頭会社トップ10 */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" 
              ref={el => {
                chartRefs.current['leading-companies'] = el;
              }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-green-600" />
                  筆頭会社トップ10
                </h2>
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart data={getTopN(analysisResults.leadingCompanies, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={300} 
                      tick={CustomYAxisTick}
                      interval={0}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [value, props.payload.originalName]}
                    />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 全会社トップ10 */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['all-companies'] = el; }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-blue-600" />
                  全体会社トップ10
                </h2>
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart data={getTopN(analysisResults.allCompanies, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={300} 
                      tick={CustomYAxisTick}
                      interval={0}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [value, props.payload.originalName]}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 筆頭会社円グラフ */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['leading-companies-pie'] = el; }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Target className="mr-2 h-6 w-6 text-purple-600" />
                  筆頭会社の割合
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={getTopN(analysisResults.leadingCompanies, 10)}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${wrapText(entry.originalName, 15)} ${(entry.percent * 100).toFixed(1)}%`}
                    >
                      {getTopN(analysisResults.leadingCompanies, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string, props: any) => [value, props.payload.originalName]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 筆頭分類コードトップ10 */}
            {analysisResults.hasFIData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['leading-fi'] = el; }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-red-600" />
                  筆頭分類コードトップ10
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopN(analysisResults.leadingFIs, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value: any, name: string, props: any) => [value, props.payload.originalName]} />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 全分類コードトップ10 */}
            {analysisResults.hasFIData && (
              <div 
                className="bg-white rounded-xl shadow-lg p-6" 
                ref={el => { chartRefs.current['all-fi'] = el; }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-indigo-600" />
                  全分類コードトップ10
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopN(analysisResults.allFIs, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value: any, name: string, props: any) => [value, props.payload.originalName]} />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 会社別時系列分析 */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" 
                ref={el => { chartRefs.current['company-timeline'] = el; }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-6 w-6 text-green-600" />
                  会社別出願件数の時系列分析
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getTimeSeriesData(analysisResults.companyYearAnalysis, getTopN(analysisResults.allCompanies, 5))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {getTopN(analysisResults.allCompanies, 5).map((company, index) => (
                      <Line
                        key={company.originalName}
                        type="linear"
                        dataKey={company.originalName}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name={company.originalName}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 分類コード別時系列分析 */}
            {analysisResults.hasFIData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => { chartRefs.current['fi-timeline'] = el; }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-6 w-6 text-purple-600" />
                  分類コード別出願件数の時系列分析
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getTimeSeriesData(analysisResults.fiYearAnalysis, getTopN(analysisResults.allFIs, 5))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {getTopN(analysisResults.allFIs, 5).map((fi, index) => (
                      <Line
                        key={fi.originalName}
                        type="linear"
                        dataKey={fi.originalName}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name={fi.originalName}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatentAnalysisApp;