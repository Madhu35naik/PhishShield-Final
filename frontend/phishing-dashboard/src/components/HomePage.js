import React from 'react';
import { Shield, Lock, Globe, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';

export default function HomePage({ onNavigateToLogin, onNavigateToRegister }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                PhishShield ML
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onNavigateToLogin}
                className="px-6 py-2 text-white hover:text-blue-400 transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={onNavigateToRegister}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            ML-Powered Phishing Detection
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Detect Malicious URLs Before
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {' '}They Cause Harm
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            A machine-learning–based system that analyzes URLs in near real-time 
            to help users identify potential phishing threats before interaction.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onNavigateToRegister}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
              Start Protecting Now
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">High</div>
            <div className="text-slate-300">Detection Accuracy</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">Fast</div>
            <div className="text-slate-300">Analysis Time</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">Multiple</div>
            <div className="text-slate-300">Attack Types Detected</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose PhishShield ML?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Near Real-Time Analysis</h3>
              <p className="text-slate-400">
                URLs are processed quickly using trained machine-learning models.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Attack Classification</h3>
              <p className="text-slate-400">
                Classifies multiple phishing attack patterns using extracted URL features.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Educational Insights</h3>
              <p className="text-slate-400">
                Provides explanations and prevention tips to improve user awareness.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-green-500/50 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Future Browser Integration</h3>
              <p className="text-slate-400">
                Designed to support future integration with browser extensions.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Batch URL Analysis</h3>
              <p className="text-slate-400">
                Supports bulk URL scanning for testing and audit scenarios.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-pink-500/50 transition-colors">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ML-Based Detection Engine</h3>
              <p className="text-slate-400">
                Uses an XGBoost-based ensemble model trained on phishing URL features.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-blue-400 mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold text-white mb-2">Enter URL</h3>
              <p className="text-slate-400 text-sm">Provide a suspicious URL for analysis</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-cyan-400 mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold text-white mb-2">Feature Extraction</h3>
              <p className="text-slate-400 text-sm">The system extracts multiple URL-based features</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-purple-400 mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold text-white mb-2">ML Prediction</h3>
              <p className="text-slate-400 text-sm">The trained model classifies the URL</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-green-400 mx-auto mb-4">4</div>
              <h3 className="text-lg font-semibold text-white mb-2">Result & Guidance</h3>
              <p className="text-slate-400 text-sm">Users receive results and prevention tips</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Try PhishShield ML?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Explore how machine learning can assist in detecting phishing URLs.
          </p>
          <button
            onClick={onNavigateToRegister}
            className="px-8 py-4 bg-white hover:bg-slate-100 text-blue-600 rounded-lg font-semibold transition-colors shadow-lg flex items-center gap-2 mx-auto"
          >
            Create Free Account
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-400">
          <p>&copy; 2025 PhishShield ML. An educational phishing detection platform using machine learning.</p>
        </div>
      </footer>
    </div>
  );
}
