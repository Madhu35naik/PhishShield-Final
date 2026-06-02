import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader2, Search, Clock, Lock, Globe, AlertCircle, Info, TrendingUp, Eye, BookOpen, Target, XCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

export default function SingleScanComponent({ 
  API_BASE_URL: propApiBaseUrl,
  singleScanData, 
  setSingleScanData 
}) {
  const finalApiBaseUrl = propApiBaseUrl || API_BASE_URL;

  const { url, result, history } = singleScanData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState(null); 
  const [activeTab, setActiveTab] = useState('overview');

  const scanUrl = async () => {
    // 🚀 FIX: Validation check FIRST. Stop everything if empty.
    if (!url.trim()) {
      setError('Please enter a URL');
      setValidationError(null);
      setSingleScanData(prev => ({ ...prev, result: null }));
      return; // 🛑 Stop execution here
    }

    setLoading(true);
    setError(''); // Clear any previous "Please enter a URL" message
    setValidationError(null); 
    setSingleScanData(prev => ({ ...prev, result: null }));
    setActiveTab('overview');

    const token = localStorage.getItem('auth_token');

    if (!token) {
        setError("Your session has expired. Please log in again.");
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(`${finalApiBaseUrl}/api/scan`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (response.status === 400 && data.error) {
        setValidationError({
          message: data.message || data.error,
          guidance: data.guidance
        });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSingleScanData(prev => ({
        ...prev,
        result: data,
        history: [
          {
            url: data.url,
            prediction: data.prediction,
            confidence: data.confidence,
            risk_score: data.risk_score,
            timestamp: new Date().toLocaleString()
          },
          ...prev.history.slice(0, 9)
        ]
      }));

    } catch (err) {
      setError(`Error: ${err.message}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) scanUrl();
  };

  const clearResults = () => {
    setSingleScanData({
        url: '',
        result: null,
        history: history 
    });
    setError('');
    setValidationError(null);
    setActiveTab('overview');
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setSingleScanData(prev => ({ ...prev, url: newUrl }));
    
    if (error || validationError) {
      setError('');
      setValidationError(null);
    }
  };

  const isPhishing = result?.prediction?.toLowerCase() === "phishing";
  
  const getRiskColor = (score) => {
    if (score >= 76) return 'text-red-400';
    if (score >= 51) return 'text-orange-400';
    if (score >= 26) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskLabel = (score) => {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="grid lg:grid-cols-4 gap-4">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-800/40 backdrop-blur rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400"/>
            Session Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total:</span>
              <span className="font-semibold">{history.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Threats:</span>
              <span className="font-semibold text-red-400">
                {history.filter(h => h.prediction?.toLowerCase() === "phishing").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Safe:</span>
              <span className="font-semibold text-green-400">
                {history.filter(h => h.prediction?.toLowerCase() === "legitimate").length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400"/>
            Recent Scans
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No scans yet</p>
            ) : (
              history.map((h, idx) => (
                <div key={idx} className="p-2 bg-slate-900/50 rounded border border-slate-700/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-xs font-semibold ${h.prediction?.toLowerCase() === 'phishing' ? 'text-red-400' : 'text-green-400'}`}>
                      {h.prediction?.toUpperCase()}
                    </span>
                    <span className={`text-xs ml-auto ${getRiskColor(h.risk_score)}`}>{h.risk_score}/100</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{h.url}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-4">
        {/* Search Input Section */}
        <div className="bg-slate-800/40 backdrop-blur rounded-lg p-5 border border-slate-700/50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter URL to analyze..."
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                disabled={loading}
              />
            </div>
            <button onClick={scanUrl} disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5"/>}
              {loading ? "Scanning" : "Analyze"}
            </button>
          </div>

          {/* 🚀 FIXED: Ensure this error alert is visible even when result is null */}
          {error && !validationError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5"/>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Validation Errors & Guidance List */}
          {validationError && (
            <div className="mt-3 space-y-3">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"/>
                  <div>
                    <h4 className="font-semibold text-yellow-400 mb-1">Invalid URL Format</h4>
                    <p className="text-yellow-300 text-sm">{validationError.message}</p>
                  </div>
                </div>
              </div>

              {/* URL Format Guide Section */}
              {validationError.guidance && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h5 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4"/>
                    URL Format Guide
                  </h5>
                  
                  {validationError.guidance.valid_examples && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-400 mb-2">✓ Valid URL Examples:</p>
                      <div className="flex flex-wrap gap-2">
                        {validationError.guidance.valid_examples.map((example, idx) => (
                          <span key={idx} className="text-xs font-mono bg-green-500/10 text-green-300 px-2 py-1 rounded border border-green-500/30">
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {validationError.guidance.tips && (
                    <ul className="space-y-1">
                      {validationError.guidance.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-blue-200 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            <div className={`p-6 rounded-lg border-2 ${isPhishing ? 'bg-red-500/5 border-red-500/50' : 'bg-green-500/5 border-green-500/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isPhishing ? <AlertTriangle className="w-8 h-8 text-red-400"/> : <CheckCircle className="w-8 h-8 text-green-400"/>}
                  <div>
                    <h3 className={`text-xl font-bold ${isPhishing ? 'text-red-400' : 'text-green-400'}`}>{isPhishing ? "Phishing Threat Detected" : "URL is Safe"}</h3>
                    <p className="text-sm text-slate-400">Confidence: {result.confidence.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${isPhishing ? 'text-red-400' : 'text-green-400'}`}>{result.confidence.toFixed(0)}%</div>
                  <div className={`text-sm font-semibold ${getRiskColor(result.risk_score)}`}>Risk: {getRiskLabel(result.risk_score)}</div>
                </div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50 text-sm break-all">{result.url}</div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
              {['overview', 'prevention', 'educational', 'details'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <div className="flex items-center gap-2">
                    {tab === 'overview' && <Eye className="w-4 h-4"/>}
                    {tab === 'prevention' && <Lock className="w-4 h-4"/>}
                    {tab === 'educational' && <BookOpen className="w-4 h-4"/>}
                    {tab === 'details' && <Info className="w-4 h-4"/>}
                    {tab}
                  </div>
                </button>
              ))}
            </div>

            {/* Tab Content Section */}
            <div className="bg-slate-800/40 backdrop-blur rounded-lg p-5 border border-slate-700/50 min-h-64">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {isPhishing && result.attack_types?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-400"><Target className="w-4 h-4"/>Attack Type Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.attack_types.map((type, i) => (
                          <span key={i} className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 border border-red-500/40 text-red-300">
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isPhishing && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                      <h3 className="text-lg font-semibold text-green-400 mb-2">All Clear!</h3>
                      <p className="text-slate-400 text-sm">This URL appears to be legitimate and safe to visit.</p>
                    </div>
                  )}
                  {isPhishing && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300"><strong>⚠️ Warning:</strong> This URL shows characteristics of a phishing attack. Do not enter personal information.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Prevention Tab */}
              {activeTab === 'prevention' && (
                <div className="space-y-4">
                  {result.prevention ? (
                    <>
                      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-2"><Shield className="w-4 h-4"/>Safety Recommendations</h4>
                      {result.prevention.warnings?.map((txt, i) => (
                        <div key={i} className="text-sm text-red-300 bg-red-500/10 p-3 rounded-lg border border-red-500/30 mb-2">⚠️ {txt}</div>
                      ))}
                      {result.prevention.advice?.map((txt, i) => (
                        <div key={i} className="text-sm text-blue-200 bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">→</span><span>{txt}</span>
                        </div>
                      ))}
                    </>
                  ) : <p className="text-slate-400 text-sm">No prevention advice available.</p>}
                </div>
              )}

              {/* Educational Tab */}
              {activeTab === 'educational' && (
                <div className="space-y-4 text-sm text-slate-300">
                  {result.educational_content ? (
                    <>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <h5 className="font-semibold text-blue-400 mb-1 flex items-center gap-2">
                          <BookOpen className="w-4 h-4"/>
                          {result.educational_content.threat_overview?.attack_type}
                        </h5>
                        <p>{result.educational_content.threat_overview?.description}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-200 mb-2">Identification Tips:</p>
                        <ul className="space-y-2">
                          {result.educational_content.identification_tips?.map((tip, i) => (
                            <li key={i} className="flex gap-2 items-start"><span className="text-blue-400">•</span>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : <p className="text-slate-400">Educational content unavailable.</p>}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                  <div className="col-span-full text-xs text-slate-500 mb-2 uppercase font-bold tracking-widest">ML Feature Vector Analysis</div>
                  {result.features && Object.entries(result.features).map(([k, v]) => (
                    <div key={k} className="flex justify-between p-2 bg-slate-900/50 rounded border border-slate-700/30 text-xs">
                      <span className="text-slate-400 font-mono">{k.replace(/_/g, ' ')}</span>
                      <span className={`font-mono font-bold ${v === 1 ? 'text-red-400' : 'text-green-400'}`}>{v === 1 ? 'DETECTED' : 'SAFE'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={clearResults} className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium">Analyze Another URL</button>
          </div>
        )}

        {/* Ready to Scan State */}
        {!result && !loading && !error && !validationError && (
          <div className="bg-slate-800/20 backdrop-blur rounded-lg p-12 border border-slate-700/30 text-center">
            <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-slate-400 mb-2">System Ready</h3>
            <p className="text-slate-500 text-sm">Input a URL above to perform a machine learning-based phishing audit.</p>
          </div>
        )}
      </div>
    </div>
  );
}