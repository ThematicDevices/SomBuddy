import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useToast } from '../contexts';
import { Wine, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      showToast(error.message, 'error');
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setIsSuccess(true);
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
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
                placeholder="••••••••"
              />
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
