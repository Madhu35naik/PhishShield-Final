import React, { useState } from 'react';
import { Loader2, List, AlertCircle, XCircle, Info } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000'; 

const getRiskColor = (score) => {
    if (score >= 76) return 'red';
    if (score >= 51) return 'orange';
    if (score >= 26) return 'yellow';
    return 'green';
};

const BatchAnalyzer = ({ API_BASE_URL: propApiBaseUrl, batchScanData, setBatchScanData }) => {
    const finalApiBaseUrl = propApiBaseUrl || API_BASE_URL;

    // Destructure persisted data from App.js props
    const { urlInput, results } = batchScanData;

    // Local UI states (safe to reset on tab switch)
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleScan = async () => {
        setError(null);
        // Clear previous results in parent state before starting new scan
        setBatchScanData(prev => ({ ...prev, results: null }));
        setIsLoading(true);

        const urls = urlInput
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .slice(0, 50); 
        
        if (urls.length === 0) {
            setError("Please enter at least one URL to scan.");
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError("Your session has expired. Please log in again.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${finalApiBaseUrl}/api/batch`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ urls })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Batch scan failed on the server.');
            }

            // Save results globally in App.js state
            setBatchScanData(prev => ({ ...prev, results: data })); 

        } catch (err) {
            console.error(err);
            setError(`Error: Could not connect to API or process results. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setBatchScanData(prev => ({ ...prev, urlInput: e.target.value }));
        if (error) setError(null);
    };

    return (
        <div className="batch-analyzer-container">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-400 mb-4">
                <List className="w-6 h-6" />
                Bulk URL Analysis
            </h2>
            <p className="text-slate-400 mb-4">Enter up to 50 URLs (one per line) for security auditing and bulk analysis.</p>

            <textarea
                value={urlInput}
                onChange={handleInputChange}
                rows="10"
                placeholder="Enter URLs here (e.g., https://example.com)&#10;https://another-site.com"
                className="w-full pl-4 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ marginBottom: '10px' }} 
                disabled={isLoading}
            />
            
            <button 
                onClick={handleScan} 
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-medium transition-colors mb-4 flex items-center gap-2"
            >
                {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin"/>Scanning...</>
                ) : 'Run Batch Analysis'}
            </button>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-start gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                    <p>{error}</p>
                </div>
            )}
            
            {/* Display Validation Errors Panel (Restored Logic) */}
            {results && results.validation_errors && results.validation_errors.length > 0 && (
                <div className="mt-4 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                        <XCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"/>
                        <div>
                            <h4 className="font-semibold text-yellow-400 mb-1">
                                Invalid URLs Detected ({results.validation_errors.length})
                            </h4>
                            <p className="text-yellow-300 text-sm">
                                The following URLs were skipped due to invalid format:
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {results.validation_errors.map((err, idx) => (
                            <div key={idx} className="p-3 bg-slate-900/50 rounded border border-yellow-500/30">
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-slate-500 font-mono">#{err.index + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-mono text-slate-300 mb-1 break-all">{err.url}</p>
                                        <p className="text-xs text-yellow-300">{err.error}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* URL Format Help Info Box */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"/>
                            <div className="text-xs">
                                <p className="text-blue-300 font-semibold mb-1">URL Format Tips:</p>
                                <ul className="text-blue-200 space-y-0.5 ml-3">
                                    <li>• Include http:// or https:// (e.g., https://example.com)</li>
                                    <li>• Use valid domain names (e.g., example.com)</li>
                                    <li>• One URL per line</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Display Results Output */}
            {results && (
                <div className="results-output mt-6 border-t border-slate-700 pt-5">
                    <SummaryTable summary={results.summary} total={results.total} />
                    <ResultList results={results.results} />
                </div>
            )}
        </div>
    );
};

// --- Sub-Components ---

const SummaryTable = ({ summary, total }) => (
    <div className="mb-8 p-5 bg-slate-800/40 rounded-lg border border-slate-700/50">
        <h3 className="text-xl font-bold text-slate-200 mb-4">Scan Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-center">
                <p className="text-xs text-slate-400">Total Processed</p>
                <p className="text-xl font-bold">{total}</p>
            </div>
            <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/30 text-center">
                <p className="text-xs text-red-400">Phishing</p>
                <p className="text-xl font-bold text-red-400">{summary.phishing_count}</p>
            </div>
            <div className="p-3 bg-green-950/20 rounded-lg border border-green-900/30 text-center">
                <p className="text-xs text-green-400">Legitimate</p>
                <p className="text-xl font-bold text-green-400">{summary.legitimate_count}</p>
            </div>
            <div className="p-3 bg-orange-950/20 rounded-lg border border-orange-900/30 text-center">
                <p className="text-xs text-orange-400">High Risk (Score ≥ 51)</p>
                <p className="text-xl font-bold text-orange-400">{summary.high_risk_count}</p>
            </div>
        </div>
        {summary.invalid_url_count > 0 && (
            <div className="mt-4 text-xs text-yellow-500 italic">
                * {summary.invalid_url_count} invalid URLs were skipped during processing.
            </div>
        )}
    </div>
);

const ResultList = ({ results }) => (
    <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-300">Detailed Results</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 border-r border-slate-700">URL</th>
                        <th className="px-4 py-3 border-r border-slate-700">Prediction</th>
                        <th className="px-4 py-3 border-r border-slate-700">Confidence</th>
                        <th className="px-4 py-3 border-r border-slate-700">Risk Score</th>
                        <th className="px-4 py-3">Attack Type / Error</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {results.map((result, i) => {
                        // FIX: Detect the score using either key
                        const currentRisk = result.risk_score !== undefined ? result.risk_score : result.risk;
                        
                        return (
                            <tr key={i} className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 max-w-sm truncate font-mono text-xs text-slate-400" title={result.url}>
                                    {result.url}
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                    {result.prediction === 'error' ? (
                                        <span className="px-2 py-1 rounded text-[10px] bg-yellow-900/40 text-yellow-300">
                                            {result.attack_types?.includes('INVALID_URL') ? 'INVALID URL' : 'ERROR'}
                                        </span>
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-[10px] ${result.prediction === 'phishing' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {result.prediction.toUpperCase()}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-400">
                                    {result.confidence > 0 ? `${result.confidence.toFixed(1)}%` : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                    {/* FIX: Ensure score logic handles both risk and risk_score keys */}
                                    {currentRisk !== undefined && currentRisk !== null ? (
                                        <div className="px-2 py-1 rounded text-[10px] font-bold w-fit"
                                             style={{ 
                                                 backgroundColor: getRiskColor(currentRisk) === 'red' ? '#991b1b' : getRiskColor(currentRisk) === 'orange' ? '#9a3412' : getRiskColor(currentRisk) === 'yellow' ? '#a16207' : '#059669',
                                                 color: getRiskColor(currentRisk) === 'yellow' ? 'black' : 'white'
                                              }}>
                                            {currentRisk}
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 text-xs">N/A</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {result.prediction === 'error' ? (
                                        <span className="text-yellow-500/80 italic">{result.error_message || 'Invalid format'}</span>
                                    ) : (
                                        <span className="text-slate-500">{result.attack_types?.join(', ').replace(/_/g, ' ') || 'None'}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

export default BatchAnalyzer;