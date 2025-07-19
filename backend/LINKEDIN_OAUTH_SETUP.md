# LinkedIn OAuth Setup Guide - OpenID Connect

## Overview

This guide walks you through setting up LinkedIn OAuth using the new **"Sign In with LinkedIn using OpenID Connect"** flow, which replaced the deprecated "Sign In with LinkedIn" API as of August 1, 2023.

## Changes Made to the Implementation

### 1. Updated OAuth Scopes
**Before (Deprecated):**
```python
'scope': 'r_liteprofile r_emailaddress'  # These scopes were deprecated
```

**After (Current):**
```python
'scope': 'openid profile email'  # New OpenID Connect scopes
```

### 2. Simplified API Endpoint
**Before (Required 2 separate API calls):**
- Profile: `GET https://api.linkedin.com/v2/me`
- Email: `GET https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))`

**After (Single API call):**
- Userinfo: `GET https://api.linkedin.com/v2/userinfo`

### 3. Simplified Data Extraction
The new userinfo endpoint returns standardized OpenID Connect fields:
```json
{
    "sub": "782bbtaQ",
    "name": "John Doe", 
    "given_name": "John",
    "family_name": "Doe",
    "email": "john.doe@email.com",
    "email_verified": true,
    "picture": "https://media.licdn-ei.com/...",
    "locale": "en-US"
}
```

## LinkedIn Developer Portal Setup

### Step 1: Access LinkedIn Developer Portal
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Navigate to **"My Apps"**

### Step 2: Create or Select Your Application
- **New Application**: Click **"Create app"** and fill in required details
- **Existing Application**: Select your existing app from the list

### Step 3: Add Required Product ⚠️ **CRITICAL STEP**
1. In your application dashboard, click on the **"Products"** tab
2. Look for **"Sign in with LinkedIn using OpenID Connect"**
3. If not present, click **"Request access"** and add it
4. **Wait for approval** (usually instant for basic access)

**Note**: This step is crucial! Without this product, you'll get 403 Forbidden errors.

### Step 4: Configure OAuth Settings
1. Go to the **"Auth"** tab in your application
2. Add your redirect URI: `http://localhost:5000/auth/linkedin/callback`
3. For production, add your production callback URL
4. Save the configuration

### Step 5: Get Your Credentials
1. Note down your **Client ID** (API Key)
2. Note down your **Client Secret**
3. Add these to your `.env` file:

```env
LINKEDIN_OAUTH_CLIENT_ID=your_client_id_here
LINKEDIN_OAUTH_CLIENT_SECRET=your_client_secret_here
```

## Environment Variables

Add these to your `backend/.env` file:

```env
# LinkedIn OAuth Configuration
LINKEDIN_OAUTH_CLIENT_ID=your_client_id_here
LINKEDIN_OAUTH_CLIENT_SECRET=your_client_secret_here

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:5173
```

## Testing the Implementation

### 1. Start Your Services
```bash
# Terminal 1: Start backend
cd backend
python server.py

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

### 2. Test LinkedIn OAuth Flow
1. Navigate to your frontend: `http://localhost:5173`
2. Click the "Sign in with LinkedIn" button
3. You should be redirected to LinkedIn's authorization page
4. Authorize the application
5. You should be redirected back and logged in

### 3. Monitor Backend Logs
Watch for these success indicators in your backend logs:
```
=== Starting LinkedIn Login Process ===
Redirect URI created: http://localhost:5000/auth/linkedin/callback

=== LinkedIn OAuth Callback Started ===
Token received successfully
Token scope: openid profile email
Userinfo response status: 200
Userinfo data received: ['sub', 'name', 'email', 'given_name', 'family_name', ...]
User processed successfully
Session created
```

## Common Issues and Solutions

### Issue 1: 403 Forbidden Error
**Symptoms:**
- Token received successfully but API call fails
- `Response status: 403`

**Solution:**
1. Go to LinkedIn Developer Portal
2. Navigate to Products tab
3. Add "Sign in with LinkedIn using OpenID Connect" product
4. Wait for approval (usually instant)

### Issue 2: Invalid Scope Error
**Symptoms:**
- Error: `unauthorized_scope_error: Scope "r_emailaddress" is not authorized`

**Solution:**
- This means old scopes are still being used
- Verify the code uses `'scope': 'openid profile email'`
- Restart the backend server

### Issue 3: Redirect URI Mismatch
**Symptoms:**
- Error during OAuth flow initiation
- Redirect URI mismatch error

**Solution:**
1. Check LinkedIn Developer Portal > Auth tab
2. Ensure `http://localhost:5000/auth/linkedin/callback` is listed
3. For production, add your production callback URL

### Issue 4: Missing Environment Variables
**Symptoms:**
- LinkedIn client not registered
- OAuth initialization fails

**Solution:**
1. Verify `.env` file has both `LINKEDIN_OAUTH_CLIENT_ID` and `LINKEDIN_OAUTH_CLIENT_SECRET`
2. Restart the backend server after adding variables

## Testing with cURL

You can manually test the userinfo endpoint:

1. **Get an access token** by going through the OAuth flow and copying it from debug logs
2. **Test the userinfo endpoint:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Accept: application/json" \
     "https://api.linkedin.com/v2/userinfo"
```

**Expected Response:**
```json
{
    "sub": "xxxxxxxx",
    "name": "John Doe",
    "given_name": "John", 
    "family_name": "Doe",
    "email": "john.doe@example.com",
    "email_verified": true
}
```

## Rate Limits

LinkedIn OpenID Connect has the following rate limits:
- **Member**: 500 requests per day
- **Application**: 100,000 requests per day

## Additional Resources

- [LinkedIn OpenID Connect Documentation](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [LinkedIn Developer Portal](https://developer.linkedin.com/)
- [OAuth 2.0 Authorization Code Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)

## Success Criteria

Your LinkedIn OAuth implementation is working correctly when:

1. ✅ No deprecated scope errors
2. ✅ No 403 Forbidden errors  
3. ✅ Successful token exchange
4. ✅ Successful userinfo API call
5. ✅ User profile data retrieved (name, email, sub)
6. ✅ User successfully logged into your application
7. ✅ User session created

## Next Steps

After successful setup:
1. Test with different LinkedIn accounts
2. Implement proper error handling for edge cases
3. Add production environment configuration
4. Consider implementing token refresh logic for long-lived sessions 