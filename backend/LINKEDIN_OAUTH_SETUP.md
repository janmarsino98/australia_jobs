# LinkedIn OAuth Setup Guide

This guide will help you set up "Sign In with LinkedIn" using OpenID Connect to retrieve user data including first name, last name, and email.

## Step 1: LinkedIn Developer App Configuration

### 1.1 Create LinkedIn App
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps/new)
2. Create a new application with these details:
   - **App name**: Your application name
   - **LinkedIn Page**: Associate with a LinkedIn page (create one if needed)
   - **Privacy policy URL**: Your privacy policy URL
   - **App logo**: Upload your app logo

### 1.2 Enable Required Products
1. Go to your app's "Products" tab
2. **IMPORTANT**: Request access to "Sign In with LinkedIn using OpenID Connect"
   - Click "Request access" 
   - This may require approval from LinkedIn
   - This product provides the `openid`, `profile`, and `email` scopes

### 1.3 Configure OAuth Settings
1. Go to the "Auth" tab
2. Add your redirect URLs under "Authorized redirect URLs for your app":
   ```
   http://localhost:5000/auth/linkedin/callback  (for development)
   https://yourdomain.com/auth/linkedin/callback (for production)
   ```
3. Note down your **Client ID** and **Client Secret**

## Step 2: Environment Variables

Add these to your `.env` file:

```bash
LINKEDIN_OAUTH_CLIENT_ID=your_client_id_here
LINKEDIN_OAUTH_CLIENT_SECRET=your_client_secret_here
FRONTEND_URL=http://localhost:5173  # or your frontend URL
```

## Step 3: Required Scopes

The implementation uses these OpenID Connect scopes:
- `openid` - Required for OpenID Connect
- `profile` - Provides access to name, given_name, family_name
- `email` - Provides access to email address

## Step 4: Testing the Implementation

### 4.1 Test OAuth Flow
1. Start your backend server
2. Navigate to: `http://localhost:5000/auth/linkedin/login`
3. Complete the LinkedIn authorization
4. Check server logs for detailed debug information

### 4.2 Debug User Data Retrieval
If you have an access token, you can test the userinfo endpoint directly:

```bash
curl -X POST http://localhost:5000/auth/linkedin/test-userinfo \
  -H "Content-Type: application/json" \
  -d '{"access_token": "your_access_token_here"}'
```

## Step 5: Expected User Data Format

When successful, LinkedIn's `/v2/userinfo` endpoint returns:

```json
{
  "sub": "linkedin_user_id",
  "name": "John Doe",
  "given_name": "John", 
  "family_name": "Doe",
  "email": "john.doe@example.com",
  "email_verified": true,
  "locale": {
    "country": "US",
    "language": "en"
  },
  "picture": "https://media.licdn.com/dms/image/..."
}
```

## Implementation Details

### Manual Token Exchange Approach

Our implementation uses a **manual token exchange** approach instead of relying on authlib's automatic JWT validation. This is necessary because:

1. **LinkedIn's JWT Implementation**: LinkedIn's OpenID Connect implementation has issues with JWT validation (missing `jwks_uri` in metadata)
2. **Reliable Data Access**: Manual approach ensures we can always access the userinfo endpoint
3. **Better Error Handling**: More control over error scenarios and debugging

### Key Features

- **CSRF Protection**: Secure state parameter validation
- **Manual Token Exchange**: Avoids LinkedIn's JWT validation issues
- **Direct API Access**: Uses LinkedIn's `/v2/userinfo` endpoint directly
- **Comprehensive Logging**: Detailed debug information for troubleshooting

## Troubleshooting

### Fixed Issues

✅ **JWT Validation Error** (`RuntimeError: Missing "jwks_uri" in metadata`)
- **Solution**: Uses manual token exchange instead of authlib's automatic JWT parsing
- **Result**: Bypasses LinkedIn's incomplete OpenID Connect metadata

✅ **Access Token Issues**
- **Solution**: Direct POST request to LinkedIn's token endpoint
- **Result**: Reliable token exchange with proper error handling

### Common Issues

1. **403 Forbidden Error**
   - Your app doesn't have "Sign In with LinkedIn using OpenID Connect" product enabled
   - Wait for LinkedIn approval if you just requested access
   - Check that your redirect URL matches exactly

2. **Invalid Scope Error**
   - Make sure your LinkedIn app has the required product enabled
   - The implementation uses `openid profile email` scopes

3. **Token Exchange Failed**
   - Check your Client ID and Client Secret in environment variables
   - Verify redirect URI matches exactly (including protocol and port)
   - Look for detailed error messages in server logs

### Debug Steps

1. **Check OAuth Configuration**:
   ```
   # Look for these in server startup logs:
   # "LinkedIn OAuth registration successful"
   # "Registered client_id: xxxxxxxxxx..."
   ```

2. **Monitor Callback Logs**:
   ```
   # Check for these success messages:
   # "Authorization code received: xxxxxxxxxx..."
   # "Token exchange successful!"
   # "Userinfo data received successfully"
   ```

3. **Test Direct API Call**:
   Use the `/auth/linkedin/test-userinfo` endpoint with a valid access token

### Expected Success Flow

```
=== LinkedIn OAuth Callback Started ===
Authorization code received: xxxxxxxxxx...
Manually exchanging authorization code for access token...
Token response status: 200
Token exchange successful!
Access token: xxxxxxxxxxxxxxxxxxxx...

Fetching user information from /v2/userinfo endpoint...
Userinfo response status: 200
Userinfo data received successfully
Available fields: ['sub', 'email', 'name', 'given_name', 'family_name', 'email_verified', 'locale', 'picture']

Extracted user data:
  Provider ID: xxxxxxxx
  Email: john.doe@example.com
  Name: John Doe
  Given name: John
  Family name: Doe

User processed successfully - ID: xxxxxxxxxxxxxxxx
Session created successfully
Redirecting to frontend: http://localhost:5173/oauth/callback?success=true
```

## Next Steps

After successful setup:
1. Test the complete OAuth flow
2. Verify user data is correctly retrieved and stored
3. Handle edge cases (user denies permission, network errors, etc.)
4. Implement proper error handling in your frontend
5. Consider implementing token refresh if needed for long-term API access

## LinkedIn API Documentation

- [Sign In with LinkedIn using OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [Authorization Code Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [UserInfo Endpoint](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2#retrieving-member-profiles-with-openid-connect) 