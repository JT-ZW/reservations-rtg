'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-['Century_Gothic',_sans-serif]">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 lg:py-0">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-block p-6 bg-gray-50 rounded-3xl shadow-xl">
              <Image 
                src="/rtg-logo.png" 
                alt="Rainbow Towers Group" 
                width={180} 
                height={60} 
                className="h-14 w-auto" 
                priority 
              />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">Enter your email to receive a password reset link</p>
          </div>

          {success ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-green-900">Check Your Email</h3>
                  <p className="text-sm text-green-800 mt-1">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Please check your inbox and follow the instructions.
                  </p>
                  <div className="mt-4">
                    <Link 
                      href="/login" 
                      className="text-sm font-medium text-brand-primary hover:text-brand-secondary"
                    >
                      ← Back to login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-900">Error</h3>
                      <p className="text-sm text-red-800 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 text-base bg-white placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: '#8B4513', color: 'white' }}
                className="w-full py-4 px-6 rounded-xl text-base font-bold hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-brand-accent/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-white font-bold">Sending...</span>
                  </div>
                ) : (
                  <span className="text-white font-bold">Send Reset Link</span>
                )}
              </button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel - Branded Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden border-l border-gray-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-50 rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative flex flex-col items-center justify-center w-full p-12">
          <div className="p-10 bg-gray-50 rounded-[3rem] shadow-2xl mb-8">
            <Image 
              src="/rtg-logo.png" 
              alt="Rainbow Towers Group" 
              width={300} 
              height={100} 
              className="h-20 w-auto" 
              priority 
            />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Rainbow Towers Group
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-md">
            Event Management System
          </p>
        </div>
      </div>
    </div>
  );
}
