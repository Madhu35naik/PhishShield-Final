import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Search, List, LogOut } from 'lucide-react';

// --- Import Components ---
import SingleScanComponent from './components/SingleScanComponent';
import BatchAnalyzer from './components/BatchAnalyzer';
import ReportsLogger from './components/ReportsLogger';

// --- Import Authentication Components ---
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';

const API_BASE_URL = 'http://localhost:5000';

// Pages
const PAGES = {
  HOME: 'home',
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
  DASHBOARD: 'dashboard',
};

// Dashboard views
const VIEW_MODES = {
  SINGLE: 'single',
  BATCH: 'batch',
  REPORTS: 'reports',
};

export default function PhishingDetectorApp() {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [viewMode, setViewMode] = useState(VIEW_MODES.SINGLE);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // API Health State
  const [apiHealth, setApiHealth] = useState(null);

  // Persistent scan states
  const [singleScanData, setSingleScanData] = useState({
    url: '',
    result: null,
    history: []
  });

  const [batchScanData, setBatchScanData] = useState({
    urlInput: '',
    results: null
  });

  // Restore session on reload
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setCurrentPage(PAGES.DASHBOARD);
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  // Health check (after login only)
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/api/health`)
      .then(res => res.json())
      .then(data => setApiHealth(data))
      .catch(() => setApiHealth({ status: "DOWN" }));
  }, [token]);

  // --- AUTH HANDLERS ---

  // Login → Dashboard
  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setCurrentPage(PAGES.DASHBOARD);
  };

  // ✅ Register → Login (NO popup)
  const handleRegisterSuccess = () => {
    setCurrentPage(PAGES.LOGIN);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setApiHealth(null);
    setCurrentPage(PAGES.HOME);
    setViewMode(VIEW_MODES.SINGLE);
    setSingleScanData({ url: '', result: null, history: [] });
    setBatchScanData({ urlInput: '', results: null });
  };

  // --- AUTH PAGES ---
  if (currentPage === PAGES.HOME) {
    return (
      <HomePage
        onNavigateToLogin={() => setCurrentPage(PAGES.LOGIN)}
        onNavigateToRegister={() => setCurrentPage(PAGES.REGISTER)}
      />
    );
  }

  if (currentPage === PAGES.LOGIN) {
    return (
      <LoginPage
        onNavigateToRegister={() => setCurrentPage(PAGES.REGISTER)}
        onNavigateToForgotPassword={() => setCurrentPage(PAGES.FORGOT_PASSWORD)}
        onLoginSuccess={handleLoginSuccess}
        API_BASE_URL={API_BASE_URL}
      />
    );
  }

  if (currentPage === PAGES.REGISTER) {
    return (
      <RegisterPage
        onNavigateToLogin={() => setCurrentPage(PAGES.LOGIN)}
        onRegisterSuccess={handleRegisterSuccess}
        API_BASE_URL={API_BASE_URL}
      />
    );
  }

  if (currentPage === PAGES.FORGOT_PASSWORD) {
    return (
      <ForgotPasswordPage
        onNavigateToLogin={() => setCurrentPage(PAGES.LOGIN)}
        API_BASE_URL={API_BASE_URL}
      />
    );
  }

  // --- Dashboard view switch ---
  const renderDashboardView = () => {
    switch (viewMode) {
      case VIEW_MODES.BATCH:
        return (
          <BatchAnalyzer
            API_BASE_URL={API_BASE_URL}
            batchScanData={batchScanData}
            setBatchScanData={setBatchScanData}
          />
        );
      case VIEW_MODES.REPORTS:
        return <ReportsLogger API_BASE_URL={API_BASE_URL} />;
      default:
        return (
          <SingleScanComponent
            API_BASE_URL={API_BASE_URL}
            singleScanData={singleScanData}
            setSingleScanData={setSingleScanData}
          />
        );
    }
  };

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">

      {/* Top Nav */}
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">

            {/* LEFT */}
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                PhishShield ML
              </span>
            </div>

            {/* CENTER */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-sm font-medium">
              {apiHealth?.model_loaded ? (
                <span className="text-green-400">● API Connected · ML Model Active</span>
              ) : (
                <span className="text-red-400">● API Disconnected</span>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Welcome back,</div>
                <div className="text-sm font-semibold">{user?.name}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-2 border-b border-slate-700 mb-6 overflow-x-auto">
          <button onClick={() => setViewMode(VIEW_MODES.SINGLE)}
            className={`${viewMode === VIEW_MODES.SINGLE ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'} px-4 py-3 flex gap-2`}>
            <Search className="w-4 h-4" /> Single Scan
          </button>

          <button onClick={() => setViewMode(VIEW_MODES.BATCH)}
            className={`${viewMode === VIEW_MODES.BATCH ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'} px-4 py-3 flex gap-2`}>
            <List className="w-4 h-4" /> Bulk Analysis
          </button>

          <button onClick={() => setViewMode(VIEW_MODES.REPORTS)}
            className={`${viewMode === VIEW_MODES.REPORTS ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'} px-4 py-3 flex gap-2`}>
            <TrendingUp className="w-4 h-4" /> Audit Reports
          </button>
        </div>

        {renderDashboardView()}

        <div className="mt-8 text-center text-xs text-slate-500">
          ML-Powered Phishing Detection • Educational Platform
        </div>
      </div>
    </div>
  );
}
