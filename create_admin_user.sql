-- Create Admin User Profile
-- Run this in Supabase SQL Editor after you've created your auth user

-- Replace 'your-email@example.com' with the actual email you use to log in
-- The UUID should match the auth.users id from Supabase Authentication

-- Step 1: First, check your auth user ID by running this query:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Copy the UUID from the result above and use it in the INSERT below
-- Replace 'YOUR-AUTH-USER-UUID-HERE' with the actual UUID

INSERT INTO users (
  id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  'YOUR-AUTH-USER-UUID-HERE',  -- Replace with your auth.users UUID
  'your-email@example.com',     -- Replace with your actual email
  'Administrator',              -- You can change this to your name
  'admin',                      -- Admin role
  true                          -- Active account
);

-- Alternative: If you want to insert for ALL existing auth users that don't have profiles yet:
-- INSERT INTO users (id, email, full_name, role, is_active)
-- SELECT 
--   au.id,
--   au.email,
--   COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
--   'admin',
--   true
-- FROM auth.users au
-- LEFT JOIN users u ON u.id = au.id
-- WHERE u.id IS NULL;
