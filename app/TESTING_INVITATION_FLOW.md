# Quick Testing Guide - User Invitation Flow

## Prerequisites

Before testing, ensure:
1. Supabase email templates are configured (see `USER_INVITATION_SETUP.md`)
2. Development server is running: `npm run dev`
3. You have admin access to create users

## Test Scenario 1: New User Invitation

### Step 1: Create New User as Admin
1. Log in as admin
2. Navigate to **Admin** → **Users**
3. Click **Create New User**
4. Fill in the form:
   - Email: `testuser@example.com`
   - Full Name: `Test User`
   - Role: `reservations`
   - Phone: (optional)
5. Notice: **No password field** - user will set their own
6. Click **Create User**
7. Confirm success message: "User created and invitation email sent successfully!"

### Step 2: Check Invitation Email
1. Check the email inbox for `testuser@example.com`
2. Look for subject: "Welcome to Rainbow Towers Group Event Management System"
3. Verify email contains:
   - Welcome message with user's name
   - Their assigned role
   - "Set Your Password" button/link
   - Expiration warning (24 hours)

### Step 3: Set Password
1. Click the "Set Your Password" link in the email
2. Verify redirect to: `http://localhost:3000/set-password`
3. Check page displays:
   - Welcome message with user's name
   - "Email Verified" success message
   - Password creation form
   - Password requirements checklist
4. Enter a password (e.g., `TestPass123`)
5. Confirm the password
6. Watch the requirements checklist turn green as you type:
   - ✓ At least 8 characters
   - ✓ One uppercase letter
   - ✓ One lowercase letter
   - ✓ One number
   - ✓ Passwords match
7. Click **Set Password & Continue**
8. Verify success alert: "Password set successfully!"
9. Verify redirect to: `http://localhost:3000/login`

### Step 4: Login with New Credentials
1. On login page, enter:
   - Email: `testuser@example.com`
   - Password: `TestPass123` (the password you just set)
2. Click **Sign In**
3. Verify successful login and redirect to dashboard
4. Check that user has correct role and permissions

## Test Scenario 2: Password Reset Flow

### Step 1: Initiate Password Reset
1. Go to login page: `http://localhost:3000/login`
2. Click **Forgot Password?** link
3. Verify redirect to: `http://localhost:3000/forgot-password`
4. Enter email: `testuser@example.com`
5. Click **Send Reset Link**
6. Verify success message: "Check Your Email"

### Step 2: Check Reset Email
1. Check the email inbox for `testuser@example.com`
2. Look for subject: "Reset Your Password - Rainbow Towers Group"
3. Verify email contains:
   - Password reset request message
   - "Reset Password" button/link
   - Expiration warning (60 minutes)
   - Security notice

### Step 3: Reset Password
1. Click the "Reset Password" link in the email
2. Verify redirect to: `http://localhost:3000/reset-password`
3. Enter new password: `NewPass456`
4. Confirm new password: `NewPass456`
5. Click **Update Password**
6. Verify success alert: "Password updated successfully!"
7. Verify redirect to: `http://localhost:3000/login`

### Step 4: Login with New Password
1. On login page, enter:
   - Email: `testuser@example.com`
   - Password: `NewPass456` (the new password)
2. Click **Sign In**
3. Verify successful login
4. Old password should no longer work

## Test Scenario 3: Invalid/Expired Links

### Test Expired Invitation Link
1. Create a user but wait 24+ hours before clicking link
2. OR manually test by removing/modifying the token in URL
3. Click invitation link
4. Verify error message: "Invalid or expired invitation link"
5. Verify link to contact administrator

### Test Expired Reset Link
1. Request password reset but wait 60+ minutes
2. OR manually test by removing/modifying the token in URL
3. Click reset link
4. Verify error message: "Invalid or expired reset link"
5. Verify option to request new reset link

## Test Scenario 4: Password Validation

### Test Weak Passwords
Try these passwords and verify they are rejected:

1. **Too short:** `Pass1` → Error: "Password must be at least 8 characters long"
2. **No uppercase:** `password123` → Error about uppercase requirement
3. **No lowercase:** `PASSWORD123` → Error about lowercase requirement
4. **No number:** `Password` → Error about number requirement
5. **Mismatch:** Enter different passwords in confirm field → Error: "Passwords do not match"

### Test Strong Password
1. Enter: `SecurePass123`
2. All requirements should turn green ✓
3. Password should be accepted

## Test Scenario 5: Duplicate User Prevention

1. Try to create a user with an existing email
2. Verify error: "User with this email already exists"
3. User creation should fail gracefully

## Test Scenario 6: Admin-Only Access

### Test Non-Admin User
1. Log in as a non-admin user (reservations, sales, etc.)
2. Try to navigate to: `http://localhost:3000/admin/users`
3. Verify error: "You do not have permission to access this page. Admin access required."

### Test Unauthenticated Access
1. Log out
2. Try to navigate to: `http://localhost:3000/admin/users`
3. Verify redirect to login page

## Test Scenario 7: Email Not Received

### Troubleshooting Steps
1. Check spam/junk folder
2. Verify email address is correct
3. Check Supabase Dashboard → Authentication → Logs
4. Look for email sending events
5. Check SMTP configuration
6. Try with a different email address

### Resend Invitation (If Needed)
Currently, to resend an invitation:
1. Admin can deactivate the user
2. Delete the user (if necessary)
3. Create the user again
4. New invitation email will be sent

## Common Issues & Solutions

### Issue: "Invalid or expired reset link"
**Solution:** Request a new password reset link. Links expire after 60 minutes.

### Issue: "User with this email already exists"
**Solution:** 
- Check if user already exists in admin panel
- If user exists but never set password, admin can delete and recreate
- If user has account, use password reset instead

### Issue: Email not received
**Solution:**
- Check spam/junk folder
- Verify email configuration in Supabase
- Check Supabase Auth logs for errors
- Ensure email service is enabled

### Issue: Password requirements not clear
**Solution:** The form shows live validation with checkmarks. Watch the requirements list as you type.

## Success Criteria

All tests pass when:
- ✅ Admin can create users without setting passwords
- ✅ Invitation emails are sent and received
- ✅ Users can set their own secure passwords
- ✅ Email verification happens automatically
- ✅ Users can log in with self-created passwords
- ✅ Password reset flow works correctly
- ✅ Weak passwords are rejected
- ✅ Expired links show appropriate errors
- ✅ Non-admins cannot create users
- ✅ Duplicate users are prevented

## Next Steps After Testing

Once all tests pass:
1. Update email templates with your branding
2. Configure custom SMTP for production
3. Update `NEXT_PUBLIC_APP_URL` for production environment
4. Deploy and test in production environment
5. Train admin users on new flow

## Notes

- **Email Delivery Time:** Can take 1-5 minutes depending on email service
- **Link Expiration:** Invitation links last 24 hours, reset links last 60 minutes
- **Multiple Resets:** Users can request multiple password resets if needed
- **Security:** All tokens are single-use and cannot be reused
