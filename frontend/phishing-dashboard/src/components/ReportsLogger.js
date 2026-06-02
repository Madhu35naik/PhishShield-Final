// frontend/src/components/ReportsLogger.js
// ENHANCED VERSION – WITH USER ISOLATION, AUTHENTICATION & RISK SCORE FIX

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Search, Loader2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

const getRiskLabel = (score) => {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MEDIUM';
    return 'LOW';
};

const getRiskColorClass = (score) => {
    if (score >= 76) return 'bg-red-500/20 text-red-300 border-red-500/40';
    if (score >= 51) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    if (score >= 26) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    return 'bg-green-500/20 text-green-300 border-green-500/40';
};

const renderISTTimestamp = (timestampString) => {
    if (!timestampString) return 'N/A';
    try {
        const date = new Date(timestampString);
        
        const datePart = date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        
        const timePart = date.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata', 
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23', 
        });

        let [hours, minutes, seconds] = timePart.split(':');
        let modifier = 'AM';
        
        if (hours >= 12) {
            modifier = 'PM';
            if (hours > 12) hours = hours % 12;
        }
        if (hours === '00') hours = '12';

        return `${datePart}, ${hours}:${minutes}:${seconds} ${modifier} IST`;

    } catch (e) {
        console.error("IST Conversion Error:", e);
        return `Error: ${timestampString}`; 
    }
};

export default function ReportsLogger({ API_BASE_URL }) {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [limit, setLimit] = useState(50);
    const [startDate, setStartDate] = useState('');
    const [expandedBatches, setExpandedBatches] = useState(new Set());

    const toggleBatchExpansion = (logId) => {
        setExpandedBatches(prev => {
            const newSet = new Set(prev);
            newSet.has(logId) ? newSet.delete(logId) : newSet.add(logId);
            return newSet;
        });
    };

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setLogs([]);

        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            setError("Authentication token not found. Please log in again.");
            setIsLoading(false);
            return;
        }

        let url = `${API_BASE_URL}/api/logs?limit=${limit}`;
        if (startDate) url += `&start_date=${startDate}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch logs from API.');
            }

            setLogs(data.reports);

        } catch (err) {
            console.error('Log fetch error:', err);
            setError(`Error fetching logs: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [limit, startDate, API_BASE_URL]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-400">
                <TrendingUp className="w-6 h-6" />
                Your Security Audit & Scan Reports
            </h2>

            {/* FILTERS */}
            <div className="bg-slate-800/40 backdrop-blur rounded-lg p-4 border border-slate-700/50 flex gap-4 items-center">
                <Search className="w-5 h-5 text-slate-400" />
                <h3 className="text-md font-medium text-slate-300">Filters:</h3>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Limit:</span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded p-1 text-sm text-white"
                    >
                        <option value="10">10</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="500">500</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">After Date:</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded p-1 text-sm text-white"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
                
                <button 
                    onClick={fetchLogs}
                    disabled={isLoading}
                    className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-medium text-sm transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Apply Filters'}
                </button>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}

            {isLoading && (
                <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-400" />
                    <p className="text-slate-400">Fetching your private logs...</p>
                </div>
            )}
            
            {!isLoading && logs.length > 0 && (
                <div className="bg-slate-800/40 backdrop-blur rounded-lg overflow-hidden border border-slate-700/50">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs uppercase bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3">Timestamp (IST)</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">URL / Batch Size</th>
                                <th className="px-4 py-3">Prediction / Summary</th>
                                <th className="px-4 py-3">Risk</th>
                                <th className="px-4 py-3">Attack Type(s)</th>
                            </tr>
                        </thead>

                        <tbody>
                            {logs.map((log) => (
                                <React.Fragment key={log._id}>
                                    <tr
                                        className={`border-b border-slate-700 hover:bg-slate-700/30 ${log.is_batch ? 'cursor-pointer' : ''}`}
                                        onClick={() => log.is_batch && toggleBatchExpansion(log._id)}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                                            {log.is_batch &&
                                                <span className="inline-block mr-2">
                                                    {expandedBatches.has(log._id)
                                                        ? <ChevronDown className="w-4 h-4 inline text-blue-400" />
                                                        : <ChevronRight className="w-4 h-4 inline text-slate-500" />}
                                                </span>}
                                            {renderISTTimestamp(log.timestamp)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className={`px-2 py-0.5 rounded text-xs font-semibold w-fit 
                                                ${log.is_batch ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                {log.is_batch ? 'BATCH' : 'SINGLE'}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 max-w-xs truncate font-mono text-xs">
                                            {log.is_batch ? `${log.url_count} URLs` : log.url}
                                        </td>

                                        <td className="px-4 py-3 font-medium">
                                            {log.is_batch ? (
                                                <span className="text-xs text-slate-400">
                                                    Threats: <span className="text-red-400 font-semibold">{log.summary?.phishing_count || 0}</span>
                                                    &nbsp;/&nbsp; Errors: <span className="text-yellow-400">{log.summary?.invalid_url_count || log.summary?.error_count || 0}</span>
                                                </span>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className={`flex items-center gap-1.5 text-xs font-semibold 
                                                        ${log.prediction === 'phishing' ? 'text-red-400' : 'text-green-400'}`}>
                                                        {log.prediction === 'phishing'
                                                            ? <AlertTriangle className="w-3 h-3"/>
                                                            : <CheckCircle className="w-3 h-3"/>}
                                                        {log.prediction?.toUpperCase()}
                                                    </div>

                                                    <div className="text-xs text-slate-400">
                                                        {log.confidence !== undefined && log.confidence !== null
                                                            ? `${parseFloat(log.confidence).toFixed(1)}% confidence`
                                                            : 'Confidence: N/A'}
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            {!log.is_batch && log.risk_score !== undefined && (
                                                <div className={`px-2 py-0.5 rounded text-xs font-semibold w-fit border ${getRiskColorClass(log.risk_score)}`}>
                                                    {log.risk_score} ({getRiskLabel(log.risk_score)})
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 max-w-xs text-xs text-slate-400">
                                            {!log.is_batch && (log.attack_types?.join(', ').replace(/_/g, ' ') || 'N/A')}
                                        </td>
                                    </tr>

                                    {/* Batch Expansion */}
                                    {log.is_batch && expandedBatches.has(log._id) && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-4 bg-slate-900/50">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-semibold text-blue-400 mb-3">
                                                        Batch URLs ({log.results_preview.length} total)
                                                    </h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className="text-xs uppercase bg-slate-800/50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">#</th>
                                                                    <th className="px-3 py-2 text-left">URL</th>
                                                                    <th className="px-3 py-2 text-left">Prediction</th>
                                                                    <th className="px-3 py-2 text-left">Confidence</th>
                                                                    <th className="px-3 py-2 text-left">Risk Score</th>
                                                                    <th className="px-3 py-2 text-left">Attack Types</th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {log.results_preview.map((result, idx) => {
                                                                    // FIX: Use both risk_score and risk fallback for Batch URLs
                                                                    const currentRisk = result.risk_score !== undefined ? result.risk_score : result.risk;
                                                                    
                                                                    return (
                                                                        <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                                                                            <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                                                                            <td className="px-3 py-2 font-mono max-w-md truncate" title={result.url}>
                                                                                {result.url}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {result.prediction === 'error'
                                                                                    ? <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ERROR</span>
                                                                                    : (
                                                                                        <span className={`flex items-center gap-1 font-semibold ${result.prediction === 'phishing' ? 'text-red-400' : 'text-green-400'}`}>
                                                                                            {result.prediction === 'phishing'
                                                                                                ? <AlertTriangle className="w-3 h-3"/>
                                                                                                : <CheckCircle className="w-3 h-3"/>}
                                                                                            {result.prediction?.toUpperCase()}
                                                                                        </span>
                                                                                    )}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {result.confidence !== undefined && result.confidence !== null
                                                                                    ? `${parseFloat(result.confidence).toFixed(1)}%`
                                                                                    : 'N/A'}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {/* FIX: Integrated risk fallback logic to display numerical score */}
                                                                                {currentRisk !== undefined && currentRisk !== null ? (
                                                                                    <div className={`px-2 py-0.5 rounded text-xs font-semibold w-fit border ${getRiskColorClass(currentRisk)}`}>
                                                                                        {currentRisk}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-slate-500">N/A</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2 max-w-xs text-slate-400">
                                                                                {result.attack_types?.join(', ').replace(/_/g, ' ') || result.error_message || 'N/A'}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && logs.length === 0 && !error && (
                <div className="text-center py-12">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">No scan history found for your account.</p>
                </div>
            )}
        </div>
    );
}