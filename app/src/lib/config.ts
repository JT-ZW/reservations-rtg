/**
 * Application Configuration
 * Centralizes environment variables and configuration
 */

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export const config = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Application
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Rainbow Towers Booking System',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
  },

  // Session
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '1800', 10), // 30 minutes default
  },

  // Timezone
  timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Harare',

  // Feature Flags
  features: {
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
} as const;

export default config;
