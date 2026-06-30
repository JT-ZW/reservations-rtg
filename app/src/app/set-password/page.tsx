'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if we have a valid invitation token in the URL
    const checkToken = async () => {
      const supabase = createClient();
      
      // Check for token in URL hash (Supabase sends it as #access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'invite' && accessToken) {
        // Valid invitation link
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setValidToken(true);
          // Get user name from metadata
          setUserName(session.user.user_metadata?.full_name || session.user.email || '');
        } else {
          setError('Invalid or expired invitation link. Please contact your administrator.');
        }
      } else {
        // Check if user is already authenticated (clicked link)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setValidToken(true);
          setUserName(session.user.user_metadata?.full_name || session.user.email || '');
        } else {
          setError('Invalid or expired invitation link. Please contact your administrator.');
        }
      }
      
      setCheckingToken(false);
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Check for at least one uppercase, one lowercase, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Success! Redirect to login
      alert('Password set successfully! You can now log in with your new password.');
      
      // Sign out to clear the invitation session
      await supabase.auth.signOut();
      
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-['Century_Gothic',sans-serif]">
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
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome{userName ? `, ${userName}` : ''}!</h2>
            <p className="text-gray-600">Set your password to complete your account setup</p>
          </div>

          {!validToken ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900">Invalid Invitation</h3>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                  <div className="mt-4">
                    <a 
                      href="/login" 
                      className="text-sm font-medium text-brand-primary hover:text-brand-secondary"
                    >
                      Go to login →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-green-900">Email Verified</h3>
                    <p className="text-sm text-green-800 mt-1">
                      Your email has been verified. Please create a secure password below.
                    </p>
                  </div>
                </div>
              </div>

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

              {/* New Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  Create Password
                </label>
                <input
                  id="password" 
                  name="password" 
                  type="password" 
                  required
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 text-base bg-white placeholder-gray-400"
                  placeholder="Enter your password"
                  minLength={8}
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 text-base bg-white placeholder-gray-400"
                  placeholder="Confirm your password"
                  minLength={8}
                />
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      {/[0-9]/.test(password) ? '✓' : '○'} One number
                    </li>
                    <li className={password === confirmPassword && password ? 'text-green-600' : 'text-gray-500'}>
                      {password === confirmPassword && password ? '✓' : '○'} Passwords match
                    </li>
                  </ul>
                </div>
              )}

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
                    <span className="text-white font-bold">Setting Password...</span>
                  </div>
                ) : (
                  <span className="text-white font-bold">Set Password & Continue</span>
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                <p>Already have an account? <a href="/login" className="font-medium text-brand-primary hover:text-brand-secondary">Sign in</a></p>
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

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
