"use client";
import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Upload, BarChart3, TrendingUp, Target } from 'lucide-react';
import * as Papa from 'papaparse';

const PatentAnalysisApp = () => {
  const [csvData, setCsvData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const chartRefs = useRef({});

  // 社名を折り返し表示する関数
  const wrapText = (text: string, maxLength = 20) => {
    if (!text || text.length <= maxLength) return text;
    
    const words = text.split(/[\s\-\/・]/);
    const lines = [];
    let currentLine = '';
    
    for (let word of words) {
      if ((currentLine + word).length <= maxLength) {
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
  const CustomYAxisTick = ({ x, y, payload }: { 
   x: number; 
   y: number; 
   payload: { value: string } 
  }) => {
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

  // CSVファイルの読み込み
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      complete: (results) => {
        try {
          const data = results.data;
          if (data.length === 0) {
            throw new Error('CSVファイルが空です');
          }
          
          // ヘッダーを取得（J-PlatPat形式）
          const headers = data[0];
          console.log('Headers:', headers); // デバッグ用
          
          // J-PlatPatの主要な列名を検索
          const applicationDateColumn = headers.find(col => 
            col.includes('出願日') || col.includes('Application Date') || col.includes('出願年月日')
          );
          const applicantColumn = headers.find(col => 
            col.includes('出願人') || col.includes('Applicant') || col.includes('権利者')
          );
          const fiColumn = headers.find(col => 
            col.includes('FI') || col.includes('F-term') || col.includes('分類')
          );
          
          console.log('Found columns:', { applicationDateColumn, applicantColumn, fiColumn }); // デバッグ用
          
          if (!applicationDateColumn) {
            throw new Error('出願日列が見つかりません。CSVファイルがJ-PlatPat形式であることを確認してください。');
          }

          // データを処理
          const processedData = data.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, headerIndex) => {
              obj[header] = row[headerIndex] || '';
            });
            return obj;
          }).filter(row => row[applicationDateColumn]); // 出願日がある行のみ

          console.log('Processed data sample:', processedData[0]); // デバッグ用

          // 年を追加
          processedData.forEach(row => {
            const dateStr = row[applicationDateColumn];
            let date;
            
            // J-PlatPatの日付形式を解析（YYYY/MM/DD, YYYY-MM-DD, YYYYMMDDなど）
            if (dateStr.includes('/')) {
              date = new Date(dateStr);
            } else if (dateStr.includes('-')) {
              date = new Date(dateStr);
            } else if (dateStr.length === 8) {
              // YYYYMMDD形式
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
        } catch (err) {
          setError(err.message);
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

  // ドラッグ&ドロップ処理
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // FileListを作成してhandleFileUploadに渡す
        const mockEvent = {
          target: {
            files: [file]
          }
        };
        handleFileUpload(mockEvent);
      } else {
        setError('CSVファイルのみアップロード可能です');
      }
    }
  };

  // アップロードエリアクリック
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // データ解析
  const analyzeData = (data, headers) => {
    try {
      // 列名を特定
      const applicantColumn = headers.find(col => 
        col.includes('出願人') || col.includes('Applicant') || col.includes('権利者')
      );
      const fiColumn = headers.find(col => 
        col.includes('FI') || col.includes('F-term') || col.includes('分類')
      );

      // 年別出願件数
      const yearCounts = {};
      data.forEach(row => {
        if (row.Year) {
          yearCounts[row.Year] = (yearCounts[row.Year] || 0) + 1;
        }
      });

      // 筆頭会社分析
      const leadingCompanies = {};
      const allCompanies = {};
      
      if (applicantColumn) {
        data.forEach(row => {
          const applicant = row[applicantColumn];
          if (applicant) {
            // セミコロン、カンマ、改行などで分割
            const companies = applicant.split(/[;,\n]/).map(c => c.trim()).filter(c => c);
            if (companies.length > 0) {
              const leadingCompany = companies[0];
              
              // 筆頭会社
              leadingCompanies[leadingCompany] = (leadingCompanies[leadingCompany] || 0) + 1;
              
              // 全会社
              companies.forEach(company => {
                allCompanies[company] = (allCompanies[company] || 0) + 1;
              });
            }
          }
        });
      }

      // FI/分類分析
      const leadingFIs = {};
      const allFIs = {};
      
      if (fiColumn) {
        data.forEach(row => {
          const fi = row[fiColumn];
          if (fi) {
            // セミコロン、カンマ、改行などで分割
            const fiCodes = fi.split(/[;,\n]/).map(code => {
              const trimmed = code.trim();
              // FIコードの先頭6文字を取得（末尾の記号を除去）
              return trimmed.length > 6 ? trimmed.substring(0, 6).replace(/[\/\-]$/, '') : trimmed;
            }).filter(code => code);
            
            if (fiCodes.length > 0) {
              const leadingFI = fiCodes[0];
              
              // 筆頭FI
              if (leadingFI) {
                leadingFIs[leadingFI] = (leadingFIs[leadingFI] || 0) + 1;
              }
              
              // 全FI
              fiCodes.forEach(code => {
                if (code) {
                  allFIs[code] = (allFIs[code] || 0) + 1;
                }
              });
            }
          }
        });
      }

      // 会社別年次分析
      const companyYearAnalysis = {};
      if (applicantColumn) {
        data.forEach(row => {
          if (row.Year && row[applicantColumn]) {
            const companies = row[applicantColumn].split(/[;,\n]/).map(c => c.trim()).filter(c => c);
            companies.forEach(company => {
              if (!companyYearAnalysis[company]) {
                companyYearAnalysis[company] = {};
              }
              companyYearAnalysis[company][row.Year] = (companyYearAnalysis[company][row.Year] || 0) + 1;
            });
          }
        });
      }

      // FI別年次分析
      const fiYearAnalysis = {};
      if (fiColumn) {
        data.forEach(row => {
          if (row.Year && row[fiColumn]) {
            const fiCodes = row[fiColumn].split(/[;,\n]/).map(code => {
              const trimmed = code.trim();
              return trimmed.length > 6 ? trimmed.substring(0, 6).replace(/[\/\-]$/, '') : trimmed;
            }).filter(code => code);
            
            fiCodes.forEach(code => {
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
    } catch (err) {
      setError('データ解析中にエラーが発生しました: ' + err.message);
      console.error('Analysis error:', err);
    }
  };

  // トップNデータを取得（社名を折り返しで表示）
  const getTopN = (data, n = 10) => {
    return Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, n)
      .map(([name, value]) => ({ 
        name: wrapText(name, 25), 
        originalName: name,
        value 
      }));
  };

  // 年次データを取得
  const getYearData = (data) => {
    return Object.entries(data)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, count]) => ({ year: parseInt(year), count }));
  };

  // 時系列データを取得
  const getTimeSeriesData = (yearAnalysis, topItems) => {
    const years = [...new Set(Object.values(yearAnalysis).flatMap(Object.keys))].sort((a, b) => parseInt(a) - parseInt(b));
    
    return years.map(year => {
      const dataPoint = { year: parseInt(year) };
      topItems.forEach(item => {
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
                選択されたファイル: {selectedFile.name}
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
            <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['year-trend'] = el}>
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
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['leading-companies'] = el}>
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
                      tick={<CustomYAxisTick />}
                      interval={0}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [value, props.payload.originalName]}
                    />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 全会社トップ10 */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['all-companies'] = el}>
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
                      tick={<CustomYAxisTick />}
                      interval={0}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [value, props.payload.originalName]}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 筆頭会社円グラフ */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['leading-companies-pie'] = el}>
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
                      label={({originalName, percent}) => `${wrapText(originalName, 15)} ${(percent * 100).toFixed(1)}%`}
                    >
                      {getTopN(analysisResults.leadingCompanies, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, props.payload.originalName]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 筆頭分類コードトップ10 */}
            {analysisResults.hasFIData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['leading-fi'] = el}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-red-600" />
                  筆頭分類コードトップ10
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopN(analysisResults.leadingFIs, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value, name, props) => [value, props.payload.originalName]} />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 全分類コードトップ10 */}
            {analysisResults.hasFIData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['all-fi'] = el}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-indigo-600" />
                  全分類コードトップ10
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopN(analysisResults.allFIs, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value, name, props) => [value, props.payload.originalName]} />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 会社別時系列分析 */}
            {analysisResults.hasApplicantData && (
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['company-timeline'] = el}>
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
              <div className="bg-white rounded-xl shadow-lg p-6" ref={el => chartRefs.current['fi-timeline'] = el}>
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