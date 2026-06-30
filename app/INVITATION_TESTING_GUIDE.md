# Invitation System - Step-by-Step Testing & Troubleshooting

## ✅ Pre-Flight Checklist

Before testing, ensure:

### 1. Supabase Email Templates Configured
- [ ] Go to https://supabase.com/dashboard/project/jkurrsgbzzsxfwkrnbbu/auth/templates
- [ ] **Invite user** template configured with HTML body
- [ ] **Reset password** template configured with HTML body
- [ ] Both templates saved

### 2. Supabase URL Configuration
- [ ] Go to https://supabase.com/dashboard/project/jkurrsgbzzsxfwkrnbbu/auth/url-configuration
- [ ] Add `http://localhost:3000/set-password` to Redirect URLs
- [ ] Add `http://localhost:3000/reset-password` to Redirect URLs
- [ ] Site URL set to `http://localhost:3000`
- [ ] Save changes

### 3. Environment Variables
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] `.env.local` has correct Supabase keys
- [ ] Dev server restarted after any `.env` changes

### 4. Middleware Updated
- [ ] `/set-password` is in the middleware skip list
- [ ] Dev server restarted after middleware changes

## 🧪 Test 1: Create User & Send Invitation

### Step 1: Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Create Test User
1. Open browser: `http://localhost:3000`
2. Login as admin
3. Navigate to **Admin → Users**
4. Click **+ Create New User**
5. Fill in form:
   - Email: Use a REAL email you can access (e.g., your own email)
   - Full Name: `Test User`
   - Role: `reservations`
   - Phone: (optional)
6. Click **Create User**

### Step 3: Check Terminal Logs
Look for these console logs:
```
Sending invitation to: your-email@example.com
Redirect URL: http://localhost:3000/set-password
Invitation sent successfully to: your-email@example.com
Auth user created: [some-uuid]
```

**If you DON'T see these logs:**
- ❌ API call failed silently
- Check browser console for errors
- Check Network tab for `/api/users` response

### Step 4: Check Email
1. Open your email inbox
2. Look for subject: "Welcome to Rainbow Towers Group Event Management System"
3. **Check spam/junk folder** if not in inbox

**If email NOT received:**
- Check Supabase Dashboard → Authentication → Logs
- Verify SMTP is configured or using Supabase's default
- Try with a different email provider (Gmail, Outlook, etc.)

### Step 5: Click Invitation Link
1. Click "Set Your Password" button in email
2. Or copy/paste the full URL

**Expected:** Browser opens to `http://localhost:3000/set-password#access_token=...`

**If redirected to login:**
- ❌ Middleware is blocking
- Check that `/set-password` is in middleware skip list
- Restart dev server

### Step 6: Set Password
1. On `/set-password` page, you should see:
   - Welcome message with your name
   - "Email Verified" green banner
   - Password creation form
   - Requirements checklist
2. Create password: `TestPass123`
3. Confirm password: `TestPass123`
4. Watch requirements turn green ✓
5. Click **Set Password & Continue**

**Expected:** Alert "Password set successfully!" and redirect to `/login`

**If it shows "Invalid invitation":**
- ❌ Token expired or invalid
- ❌ Session issue
- Check browser console for errors
- Try creating a new user and using fresh link immediately

### Step 7: Login
1. On login page, enter:
   - Email: (the test user email)
   - Password: `TestPass123`
2. Click **Sign In**

**Expected:** Successfully logged in and redirected to dashboard

## 🧪 Test 2: Resend Invitation

### Step 1: Go to User Edit Page
1. Navigate to **Admin → Users**
2. Find your test user
3. Click **Edit**

### Step 2: Check Terminal Logs
```
Resending invitation to: your-email@example.com
User ID: [uuid]
Redirect URL: http://localhost:3000/set-password
Invitation resent successfully to: your-email@example.com
```

### Step 3: Click Resend Button
1. Click **📧 Resend Invitation** button
2. Confirm the action

**Expected:** Alert "Invitation email sent successfully!"

### Step 4: Check Email Again
New invitation email should arrive (check spam too)

## 🔧 Troubleshooting Common Issues

### Issue 1: "User not found" when resending invitation
**Cause:** Async params issue (now fixed)
**Solution:** Code has been updated with `await params`

### Issue 2: Email never arrives
**Possible causes:**
1. **Supabase email rate limiting**
   - Wait 5-10 minutes between sends
   - Check Supabase Dashboard → Auth → Logs for "rate limit" errors

2. **Email templates not saved**
   - Go back to Supabase dashboard
   - Re-check and re-save email templates

3. **Wrong email address**
   - Use a real, accessible email
   - Try different email provider

4. **SMTP not configured for production**
   - Development uses Supabase's limited email service
   - For production, configure custom SMTP

**Actions:**
```bash
# Check Supabase logs
1. Go to https://supabase.com/dashboard/project/jkurrsgbzzsxfwkrnbbu/logs/explorer
2. Run query:
   SELECT * FROM auth.audit_log_entries 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
3. Look for 'invite' or 'email' events
```

### Issue 3: Redirects to login instead of /set-password
**Cause:** Middleware blocking authenticated users
**Solution:** Already fixed - `/set-password` is now in skip list

**Verify:**
```typescript
// In middleware.ts, should have:
if (
  request.nextUrl.pathname === '/login' ||
  request.nextUrl.pathname === '/forgot-password' ||
  request.nextUrl.pathname === '/reset-password' ||
  request.nextUrl.pathname === '/set-password' ||  // ← This line
  request.nextUrl.pathname.startsWith('/api/auth/')
) {
  return NextResponse.next();
}
```

### Issue 4: "Invalid or expired invitation"
**Causes:**
1. Link already used (tokens are single-use)
2. Link expired (24 hours for invitations)
3. Clicked link but navigated away before setting password

**Solution:** Resend invitation or create new user

### Issue 5: Password requirements not met
**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Valid examples:**
- `Password123`
- `Test Pass1`
- `MyPass word1`

### Issue 6: Terminal shows errors but no details
**Add more logging:**
Check terminal when creating/resending invitation for:
```
Sending invitation to: ...
Redirect URL: ...
Invitation sent successfully: ...
```

If you see:
```
User invitation error: ...
Error details: { ... }
```

Copy the full error and check:
- Supabase service role key is correct
- Supabase project is active
- Email service is enabled

## 📊 Success Criteria

All these should work:
- [x] Create user without password field
- [x] Invitation email sent automatically
- [x] Email arrives in inbox (or spam)
- [x] Click link → lands on `/set-password`
- [x] Set password with validation
- [x] Login with new password works
- [x] Resend invitation works
- [x] Password reset works from `/forgot-password`

## 🆘 Still Not Working?

### Quick Debug Steps:
1. **Check Supabase Dashboard Logs:**
   - Authentication → Logs
   - Look for any errors or rate limits

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed API calls

3. **Check Terminal Output:**
   - Look for "invitation sent" logs
   - Look for any error stack traces

4. **Verify Supabase Settings:**
   - Authentication → Email Auth: Enabled
   - Authentication → Email Templates: Configured and saved
   - Authentication → URL Configuration: Correct redirect URLs

5. **Try a Clean Test:**
   ```powershell
   # Stop server
   # Delete .next folder
   rm -r .next
   # Restart
   npm run dev
   ```

### Get Help:
If still stuck, provide:
1. Terminal output when creating user
2. Browser console errors
3. Supabase auth logs screenshot
4. Confirmation that email templates are saved
5. Confirmation that URL configuration is correct

## 🎯 Expected Behavior Summary

### Creating User:
1. Admin fills form (no password)
2. API creates auth user + profile
3. Supabase sends invitation email
4. Admin sees success message

### User Receiving Invitation:
1. User gets email within 1-5 minutes
2. Email has "Set Your Password" button
3. Link format: `http://localhost:3000/set-password#access_token=...&type=invite...`

### Setting Password:
1. User clicks link
2. Lands on `/set-password` page (not redirected away)
3. Sees welcome message with their name
4. Sees "Email Verified" green banner
5. Creates password meeting requirements
6. Redirected to login
7. Can log in successfully

### Resending Invitation:
1. Admin edits user
2. Clicks "Resend Invitation"
3. New email sent
4. Process same as above

---

**Last Updated:** November 10, 2025
**Status:** All code fixed and ready for testing
