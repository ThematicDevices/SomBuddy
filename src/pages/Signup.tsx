import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useToast } from '../contexts';
import { Wine, Loader2, Eye, EyeOff, Mail, CheckCircle, Check, X } from 'lucide-react';

// Password strength validation
interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
];

export function Signup() {
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Prevent double-submit
  const isSubmittingRef = useRef(false);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    return passwordRequirements.filter(req => req.test(password)).length;
  }, [password]);

  const isPasswordStrong = passwordStrength === passwordRequirements.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (!isPasswordStrong) {
      showToast('Please meet all password requirements', 'error');
      return;
    }

    // Prevent double-submit
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        showToast(error.message, 'error');
      } else {
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Show success screen after account creation
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-charcoal-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-display font-bold text-charcoal-900 mb-2">
            Check Your Email
          </h1>

          <p className="text-charcoal-600 mb-6">
            We've sent a verification link to:
          </p>

          <div className="bg-white rounded-xl border border-charcoal-200 px-4 py-3 mb-6 inline-flex items-center gap-2">
            <Mail className="w-5 h-5 text-charcoal-400" />
            <span className="font-medium text-charcoal-900">{email}</span>
          </div>

          <p className="text-charcoal-500 text-sm mb-8">
            Click the link in the email to verify your account.
            Once verified, you can sign in and start building your wine collection.
          </p>

          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-3 bg-wine-900 text-white rounded-xl hover:bg-wine-800 font-medium transition-colors text-center"
            >
              Go to Sign In
            </Link>

            <button
              onClick={() => setIsSuccess(false)}
              className="block w-full py-3 bg-charcoal-100 text-charcoal-700 rounded-xl hover:bg-charcoal-200 font-medium transition-colors"
            >
              Use a Different Email
            </button>
          </div>

          <p className="text-charcoal-400 text-sm mt-6">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-wine-900 rounded-2xl mb-4">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900">Create Account</h1>
          <p className="text-charcoal-500 mt-1">Start your wine collection journey</p>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength >= level
                            ? passwordStrength === 4
                              ? 'bg-green-500'
                              : passwordStrength >= 3
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-charcoal-200'
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="text-xs space-y-0.5">
                    {passwordRequirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-1">
                        {req.test(password) ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-charcoal-300" />
                        )}
                        <span className={req.test(password) ? 'text-green-600' : 'text-charcoal-400'}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-300 bg-red-50'
                    : 'border-charcoal-200'
                }`}
                placeholder="••••••••"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-wine-900 text-white rounded-xl hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Create Account
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-charcoal-500">
          Already have an account?{' '}
          <Link to="/login" className="text-wine-700 hover:text-wine-900 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
