import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useToast } from '../contexts';
import { Wine, Loader2, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setSent(true);
      showToast('Password reset email sent!', 'success');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-charcoal-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-wine-900 rounded-2xl mb-4">
            <Wine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-charcoal-900">Reset Password</h1>
          <p className="text-charcoal-500 mt-1">
            {sent ? 'Check your email for a reset link' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal-100 p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-charcoal-600 mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-wine-700 hover:text-wine-900 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-wine-900 text-white rounded-xl hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-charcoal-500">
          Remember your password?{' '}
          <Link to="/login" className="text-wine-700 hover:text-wine-900 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
