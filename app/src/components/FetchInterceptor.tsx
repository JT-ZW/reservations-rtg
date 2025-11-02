'use client';

import { useEffect } from 'react';

/**
 * Fetch Interceptor Component
 * 1. Adds cache control headers to prevent stale data
 * 2. Intercepts 401 errors and redirects to login
 */
export default function FetchInterceptor() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch to add cache control and handle auth errors
    window.fetch = async function(...args) {
      const [resource, config] = args;

      // Preserve existing headers and add cache control
      const existingHeaders = (config as RequestInit)?.headers || {};
      
      // Convert Headers object to plain object if needed
      let headersObj: Record<string, string> = {};
      if (existingHeaders instanceof Headers) {
        existingHeaders.forEach((value, key) => {
          headersObj[key] = value;
        });
      } else if (Array.isArray(existingHeaders)) {
        // Handle array format
        existingHeaders.forEach(([key, value]) => {
          headersObj[key] = value;
        });
      } else {
        headersObj = { ...existingHeaders };
      }

      // Add cache control headers WITHOUT overwriting existing ones
      const newConfig: RequestInit = {
        ...config,
        cache: 'no-store',
        headers: {
          ...headersObj,
          // Only add cache headers, preserve all other headers (like apikey)
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      };

      try {
        const response = await originalFetch(resource, newConfig);
        
        // Check for authentication errors
        if (response.status === 401) {
          console.error('FetchInterceptor: 401 Unauthorized - Session expired');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?error=session_expired';
          }
        }

        return response;
      } catch (error) {
        console.error('FetchInterceptor: Request failed', error);
        throw error;
      }
    };

    // Cleanup: restore original fetch on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
