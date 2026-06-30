/**
 * Session Timeout Hook
 * Automatically signs out users after period of inactivity
 */

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_BEFORE_TIMEOUT = 1 * 60 * 1000; // 1 minute before timeout

export function useSessionTimeout(onWarning?: () => void, onTimeout?: () => void) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      // Clear existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);

      // Set warning timer
      if (onWarning) {
        warningRef.current = setTimeout(() => {
          onWarning();
        }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT);
      }

      // Set timeout timer
      timeoutRef.current = setTimeout(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        if (onTimeout) {
          onTimeout();
        }
        window.location.href = '/login?reason=timeout';
      }, INACTIVITY_TIMEOUT);
    };

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Initial timer setup
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [onWarning, onTimeout]);
}
