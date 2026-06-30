# User Invitation & Password Reset Setup Guide

This guide explains how to configure the invitation-based authentication flow with email verification and password reset functionality.

## Overview

The system now uses a secure invitation-based authentication flow:

1. **Admin creates user** → Only email, name, and role required (no password)
2. **System sends invitation email** → User receives secure link to set password
3. **User sets password** → Email is automatically verified in the process
4. **User can log in** → With their self-created secure password
5. **Password reset available** → Easy self-service password recovery

## Supabase Email Templates Configuration

To enable this flow, you need to configure email templates in your Supabase dashboard.

### Step 1: Access Email Templates

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `jkurrsgbzzsxfwkrnbbu`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Invitation Email Template

Select **Invite user** template and customize:

**Subject:**
```
Welcome to Rainbow Towers Group Event Management System
```

**Email Body (HTML):**
```html
<h2>Welcome to Rainbow Towers Group!</h2>

<p>Hello {{ .Name }},</p>

<p>You have been invited to join the Rainbow Towers Group Event Management System with the role of <strong>{{ .Role }}</strong>.</p>

<p>To complete your account setup and create your password, please click the button below:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #8B4513; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Set Your Password</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p><strong>Note:</strong> This link will expire in 24 hours for security reasons.</p>

<p>If you did not expect this invitation, please contact your system administrator.</p>

<p>Best regards,<br>
Rainbow Towers Group Team</p>
```

**Redirect URL:**
```
http://localhost:3000/set-password
```
*Note: For production, change this to your production URL (e.g., `https://yourdomain.com/set-password`)*

### Step 3: Configure Password Recovery Email Template

Select **Reset password** template and customize:

**Subject:**
```
Reset Your Password - Rainbow Towers Group
```

**Email Body (HTML):**
```html
<h2>Password Reset Request</h2>

<p>Hello,</p>

<p>We received a request to reset your password for your Rainbow Towers Group Event Management System account.</p>

<p>To reset your password, please click the button below:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #8B4513; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p><strong>Note:</strong> This link will expire in 60 minutes for security reasons.</p>

<p>If you did not request a password reset, please ignore this email or contact your system administrator if you have concerns.</p>

<p>Best regards,<br>
Rainbow Towers Group Team</p>
```

**Redirect URL:**
```
http://localhost:3000/reset-password
```
*Note: For production, change this to your production URL*

### Step 4: Configure Email Sender

1. Navigate to **Authentication** → **Email Auth**
2. Ensure **Enable Email Confirmations** is enabled
3. Configure your SMTP settings or use Supabase's default email service

**For Production:** It's highly recommended to set up custom SMTP with your own domain:
- Go to **Project Settings** → **Auth** → **SMTP Settings**
- Configure your SMTP server (e.g., SendGrid, AWS SES, Gmail)
- This ensures better deliverability and branding

### Step 5: Test Email Delivery

1. Create a test user from the admin panel
2. Check that the invitation email is received
3. Click the link and verify it redirects to `/set-password`
4. Set a password and confirm successful login

## Security Features

### Password Requirements

The system enforces strong passwords with the following requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

These requirements are validated both on the client and through Supabase Auth.

### Email Verification

- Email verification happens automatically when users set their password via invitation
- No separate email verification step required
- Links expire after 24 hours (invitation) or 60 minutes (password reset)

### Token Security

- Supabase uses secure, cryptographically random tokens
- Tokens are single-use and expire after usage
- All authentication flows use HTTPS in production

## User Experience Flow

### New User Invitation Flow

```
1. Admin creates user (email + name + role)
   ↓
2. System sends invitation email
   ↓
3. User clicks "Set Your Password" link
   ↓
4. User is redirected to /set-password
   ↓
5. User creates secure password
   ↓
6. Email is verified + Account activated
   ↓
7. User redirected to /login
   ↓
8. User logs in with new credentials
```

### Password Reset Flow

```
1. User clicks "Forgot Password?" on login page
   ↓
2. User enters email address
   ↓
3. System sends password reset email
   ↓
4. User clicks "Reset Password" link
   ↓
5. User is redirected to /reset-password
   ↓
6. User sets new password
   ↓
7. User redirected to /login
   ↓
8. User logs in with new password
```

## Environment Variables

Ensure these are set in your `.env.local` file:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://jkurrsgbzzsxfwkrnbbu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Production:** Update `NEXT_PUBLIC_APP_URL` to your production domain.

## API Endpoints

### Create User with Invitation
```
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "reservations",
  "phone": "+263123456789" // optional
}

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "reservations",
  "is_active": true,
  "message": "User created successfully. An invitation email has been sent."
}
```

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify SMTP settings in Supabase dashboard
3. Check Supabase logs: **Authentication** → **Logs**
4. Ensure email address is valid

### Invalid/Expired Link

- Links expire after 24 hours (invitation) or 60 minutes (password reset)
- Request a new invitation/reset if link expired
- Ensure URL matches the configured redirect URL

### Password Not Meeting Requirements

- Ensure password has at least 8 characters
- Include uppercase, lowercase, and numbers
- Check browser console for validation errors

## Testing Checklist

- [ ] Admin can create user without password
- [ ] Invitation email is sent and received
- [ ] Invitation link redirects to /set-password
- [ ] User can set password with validation
- [ ] Email is automatically verified
- [ ] User can log in with new password
- [ ] Password reset link works from /forgot-password
- [ ] Password reset email is received
- [ ] User can reset password successfully
- [ ] Strong password requirements enforced

## Production Deployment

Before deploying to production:

1. **Update Environment Variables:**
   - Set `NEXT_PUBLIC_APP_URL` to production domain
   - Ensure all Supabase keys are production keys

2. **Update Email Templates:**
   - Change redirect URLs to production URLs
   - Update email branding/styling as needed

3. **Configure Custom SMTP:**
   - Set up custom SMTP for better deliverability
   - Use your domain email for sender address

4. **Test Thoroughly:**
   - Test invitation flow end-to-end
   - Test password reset flow
   - Test email delivery and links

5. **Monitor:**
   - Check Supabase Auth logs regularly
   - Monitor email delivery rates
   - Watch for any authentication errors

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs/guides/auth
- Review authentication logs in Supabase dashboard
- Contact system administrator
