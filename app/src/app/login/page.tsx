'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Check if redirected due to session expiry
    if (searchParams.get('error') === 'session_expired') {
      setSessionExpired(true);
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !data?.user || !data.session) {
        setError(authError?.message ?? 'Unable to sign in');
        
        // Log failed login attempt
        try {
          await fetch('/api/auth/log-failed-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: email.trim(),
              error: authError?.message ?? 'Unable to sign in'
            }),
          });
        } catch (logError) {
          // Silently fail - don't block user experience
          console.error('Failed to log login attempt:', logError);
        }
        
        setLoading(false);
        return;
      }

      await supabase.auth.getSession();

      const syncResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
      });

      if (!syncResponse.ok) {
        setError('Failed to establish session');
        setLoading(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-['Century_Gothic',_sans-serif]">
      {/* Left Panel - Login Form */}
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

          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Log In</h2>
            <p className="text-gray-600">Welcome back! Please enter your details</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Expired Warning */}
            {sessionExpired && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-yellow-900">Session Expired</h3>
                    <p className="text-sm text-yellow-800 mt-1">For your security, your session has expired. Please log in again.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && !sessionExpired && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-900">Authentication Error</h3>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
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

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="current-password" 
                  required
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all duration-200 text-gray-900 text-base bg-white placeholder-gray-400"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <a 
                href="/forgot-password" 
                className="text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors"
              >
                Forgot password?
              </a>
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
                  <span className="text-white font-bold">Signing in...</span>
                </div>
              ) : (
                <span className="text-white font-bold">Log in</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel - Branded Section with Logo (White Background) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden border-l border-gray-200">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-50 rounded-full -ml-48 -mb-48"></div>

        {/* Logo Container - Centered */}
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center">
            {/* Title Above Logo */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Function Reservations System
            </h1>
            
            {/* Large Logo Card */}
            <div className="inline-block p-12 bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <Image 
                src="/rtg-logo.png" 
                alt="Rainbow Towers Group" 
                width={400} 
                height={150} 
                className="w-96 h-auto" 
                priority 
              />
            </div>
            
            {/* Tagline */}
            <p className="mt-8 text-2xl font-light text-gray-700">
              Refreshing Hotels, Amazing Experiences!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
