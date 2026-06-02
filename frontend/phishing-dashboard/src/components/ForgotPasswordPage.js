import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';

export default function ForgotPasswordPage({ onNavigateToLogin, API_BASE_URL }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Invalid email format' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateResetForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (!Object.values(passwordStrength).every(v => v)) {
      newErrors.newPassword = 'Password does not meet all requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async () => {
    setServerError('');
    setSuccessMessage('');
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Email verified. Please set a new password.');
        setStep(2);
      } else {
        setServerError(data.error || 'Failed to verify email');
      }
    } catch (err) {
      setServerError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setServerError('');
    setSuccessMessage('');
    if (!validateResetForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Password successfully updated!');
        setTimeout(() => onNavigateToLogin(), 2000);
      } else {
        setServerError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setServerError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      setEmail(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'newPassword') {
        checkPasswordStrength(value);
      }
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      step === 1 ? handleRequestReset() : handleResetPassword();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-blue-400" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              PhishShield ML
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="text-slate-400">
            {step === 1 ? 'Verify your registered email' : 'Enter your new password'}
          </p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-8 shadow-2xl space-y-6">

          {successMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm">{successMessage}</p>
            </div>
          )}

          {serverError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{serverError}</p>
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <button
                onClick={handleRequestReset}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify Email'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
              </button>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onNavigateToLogin}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
