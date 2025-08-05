'use client';
console.log('Loaded change-password/page.tsx file');
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// --- Type Definitions for State ---
interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Errors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  submit?: string; // For general submission errors
}

interface PasswordStrengthRules {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  rules: PasswordStrengthRules;
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-100">
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <pre className="text-xs text-left text-gray-700 overflow-x-auto max-w-md mx-auto bg-gray-100 p-2 rounded">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- ChangePasswordPage Component ---
function ChangePasswordPageInner() {
  const { user, isAuthenticated, loadingAuth, changePassword } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    rules: { length: false, uppercase: false, lowercase: false, number: false, special: false }
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPasswordChanged() {
      if (!user) return;
      const { data, error } = await supabase
        .from('users')
        .select('password_changed')
        .eq('auth_user_id', user.id)
        .single();
      if (error || !data) {
        setPasswordChanged(null);
      } else {
        setPasswordChanged(data.password_changed);
      }
    }
    if (!loadingAuth && isAuthenticated && user) {
      checkPasswordChanged();
    }
  }, [isAuthenticated, user, loadingAuth]);

  useEffect(() => {
    if (!loadingAuth) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (passwordChanged === true) {
        router.push('/students/dashboard');
      }
    }
  }, [isAuthenticated, loadingAuth, passwordChanged, router]);

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to change your password.</div>;
  }

  const validatePassword = (password: string) => {
    const rules: PasswordStrengthRules = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const score = Object.values(rules).filter(Boolean).length;
    const feedback = [];
    if (!rules.length) feedback.push("At least 8 characters");
    if (!rules.uppercase) feedback.push("One uppercase letter");
    if (!rules.lowercase) feedback.push("One lowercase letter");
    if (!rules.number) feedback.push("One number");
    if (!rules.special) feedback.push("One special character");
    return { score, feedback, rules };
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSubmitError('');
    setSubmitSuccess(false);
    if (field === 'newPassword') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const { score } = validatePassword(formData.newPassword);
      if (score < 5) {
        newErrors.newPassword = 'Password does not meet security requirements';
      }
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setSubmitError('');
    setSubmitSuccess(false);
    console.log('Submitting password change', formData);
    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
    console.log('changePassword result', result);
    if (result.success) {
      setSubmitSuccess(true);
      setTimeout(() => router.push('/students/dashboard'), 2000);
    } else {
      setSubmitError(result.error || 'Failed to change password');
    }
    setIsLoading(false);
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  if (loadingAuth) {
    console.log('loadingAuth true, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || passwordChanged === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('Rendering change password form', { formData, errors, passwordStrength, submitSuccess, submitError });

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-amber-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Change Your Password
            </h1>
            <p className="text-gray-600 text-sm">
              For security reasons, you must change your password before continuing
            </p>
          </div>
          
          {/* Password Visibility Hint */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Tip: Click the eye icon next to each password field to show/hide what you&apos;re typing
            </p>
          </div>

          <div className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Type your current password here..."
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title={showPasswords.current ? 'Hide password' : 'Show password'}
                >
                  {showPasswords.current ? (
                    <EyeOff size={20} className="text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye size={20} className="text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle size={16} className="inline mr-1" />
                  {errors.currentPassword}
                </p>
              )}
            </div>
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Type your new password here..."
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title={showPasswords.new ? 'Hide password' : 'Show password'}
                >
                  {showPasswords.new ? (
                    <EyeOff size={20} className="text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye size={20} className="text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Password strength:</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <p key={index} className="flex items-center">
                          {passwordStrength.rules[Object.keys(passwordStrength.rules).find(key => item.toLowerCase().includes(key))] ? (
                            <CheckCircle size={16} className="text-green-500 mr-1" />
                          ) : (
                            <XCircle size={16} className="text-red-500 mr-1" />
                          )}
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.newPassword && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle size={16} className="inline mr-1" />
                  {errors.newPassword}
                </p>
              )}
            </div>
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Type your new password again..."
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title={showPasswords.confirm ? 'Hide password' : 'Show password'}
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={20} className="text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye size={20} className="text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle size={16} className="inline mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-colors duration-300 ${
                isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } flex items-center justify-center`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Change Password'
              )}
            </button>
            {/* General Submit Messages */}
            {submitSuccess && (
              <p className="text-green-600 text-center text-sm mt-4 flex items-center justify-center">
                <CheckCircle size={16} className="inline mr-1" />
                Password updated successfully! Redirecting...
              </p>
            )}
            {submitError && (
              <p className="text-red-600 text-center text-sm mt-4 flex items-center justify-center">
                <XCircle size={16} className="inline mr-1" />
                {submitError}
              </p>
            )}
          </div>
        </div>
      </div>
  );
}

// Remove AuthProvider wrapper from the page export
export default function ChangePasswordPage() {
  return <ChangePasswordPageInner />;
}
