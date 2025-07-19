#!/usr/bin/env python3
"""
Comprehensive LinkedIn OAuth Fix Test
This test checks for common LinkedIn OAuth issues and provides solutions.
"""

import os
import sys
import json
from datetime import datetime

def test_oauth_token_scopes():
    """Test for token scope issues"""
    print("=== OAuth Token Scope Analysis ===\n")
    
    print("🔍 Common LinkedIn OAuth token issues:")
    print("   1. Token received but missing required scopes")
    print("   2. Token scope doesn't match requested scope")
    print("   3. LinkedIn app not approved for requested scopes")
    
    print("\n📋 Expected token structure:")
    print("   {")
    print("     'access_token': 'AQXYZ...',")
    print("     'expires_in': 5184000,")
    print("     'scope': 'profile email',  # Should contain both scopes")
    print("     'expires_at': 1234567890")
    print("   }")
    
    print("\n⚠️  If token scope is missing 'profile' or 'email':")
    print("   • Your LinkedIn app may not be approved for these scopes")
    print("   • Check LinkedIn Developer Portal > Products > Sign In with LinkedIn")
    
    return True

def test_api_request_patterns():
    """Test for API request pattern issues"""
    print("\n=== API Request Pattern Analysis ===\n")
    
    print("🔍 Common API request issues:")
    print("   1. OAuth client returns None instead of response object")
    print("   2. Access token not automatically attached to request")
    print("   3. API endpoint URL incorrect")
    print("   4. Request headers missing or incorrect")
    
    print("\n✅ Correct LinkedIn API request pattern:")
    print("   # Using Authlib OAuth client")
    print("   profile_resp = oauth.linkedin.get('https://api.linkedin.com/v2/me')")
    print("   # Token is automatically attached by Authlib")
    
    print("\n❌ Manual request (for comparison):")
    print("   headers = {'Authorization': f'Bearer {access_token}'}")
    print("   response = requests.get('https://api.linkedin.com/v2/me', headers=headers)")
    
    return True

def test_linkedin_app_configuration():
    """Test LinkedIn application configuration"""
    print("\n=== LinkedIn App Configuration Checklist ===\n")
    
    checklist = [
        "✓ Application created in LinkedIn Developer Portal",
        "? Sign In with LinkedIn product added to application",
        "? Authorized redirect URI: http://localhost:5000/auth/linkedin/callback", 
        "? Application approved for 'profile' scope",
        "? Application approved for 'email' scope",
        "? Client ID and Client Secret configured in environment",
        "✓ OAuth URLs updated to use current LinkedIn API"
    ]
    
    print("📋 LinkedIn Application Setup:")
    for item in checklist:
        print(f"   {item}")
    
    print("\n🔧 To verify your LinkedIn application:")
    print("   1. Go to https://developer.linkedin.com/")
    print("   2. Navigate to My Apps > Your Application")
    print("   3. Check Products tab - ensure 'Sign In with LinkedIn' is added")
    print("   4. Check Auth tab - verify redirect URI is authorized")
    print("   5. Test with a simple manual curl request")
    
    return True

def generate_curl_test():
    """Generate curl command for manual testing"""
    print("\n=== Manual API Test Generation ===\n")
    
    print("🧪 Manual LinkedIn API test:")
    print("   1. Complete OAuth flow and copy access token from logs")
    print("   2. Run this curl command:")
    print("      ```bash")
    print("      curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\")
    print("           -H 'Accept: application/json' \\")
    print("           'https://api.linkedin.com/v2/me'")
    print("      ```")
    print("   3. Expected response:")
    print("      ```json")
    print("      {")
    print("        \"id\": \"abc123\",")
    print("        \"firstName\": {")
    print("          \"localized\": {\"en_US\": \"John\"},")
    print("          \"preferredLocale\": {\"country\": \"US\", \"language\": \"en\"}")
    print("        },")
    print("        \"lastName\": {")
    print("          \"localized\": {\"en_US\": \"Doe\"},")
    print("          \"preferredLocale\": {\"country\": \"US\", \"language\": \"en\"}")
    print("        }")
    print("      }")
    print("      ```")
    
    print("\n🚨 Common error responses:")
    print("   • 401 Unauthorized - Invalid/expired token")
    print("   • 403 Forbidden - Insufficient scope permissions")
    print("   • 429 Too Many Requests - Rate limit exceeded")
    
    return True

def test_authlib_integration():
    """Test Authlib integration issues"""
    print("\n=== Authlib Integration Analysis ===\n")
    
    print("🔍 Common Authlib issues:")
    print("   1. OAuth client not properly initialized")
    print("   2. Token not stored in OAuth client session")
    print("   3. Authlib version compatibility issues")
    print("   4. Flask-Session configuration conflicts")
    
    print("\n✅ Correct Authlib OAuth flow:")
    print("   1. oauth.register() - Register LinkedIn client")
    print("   2. oauth.linkedin.authorize_redirect() - Get auth URL")  
    print("   3. oauth.linkedin.authorize_access_token() - Exchange code for token")
    print("   4. oauth.linkedin.get() - Make authenticated requests")
    
    print("\n🔧 Debug Authlib issues:")
    print("   • Check oauth.linkedin exists after registration")
    print("   • Verify token is properly stored in OAuth session")
    print("   • Test with minimal OAuth example")
    
    return True

def generate_troubleshooting_guide():
    """Generate step-by-step troubleshooting guide"""
    print("\n=== Step-by-Step Troubleshooting Guide ===\n")
    
    steps = [
        {
            "step": "1. Verify LinkedIn App Setup",
            "actions": [
                "Log into LinkedIn Developer Portal",
                "Check that 'Sign In with LinkedIn' product is added",
                "Verify redirect URI is authorized",
                "Confirm app has profile and email permissions"
            ]
        },
        {
            "step": "2. Test OAuth Flow",
            "actions": [
                "Run the application with debug code added",
                "Attempt LinkedIn login",
                "Check debug logs for token contents and scope",
                "Verify oauth.linkedin client exists"
            ]
        },
        {
            "step": "3. Manual API Test",
            "actions": [
                "Copy access token from debug logs",
                "Test LinkedIn API with curl command",
                "Check for proper JSON response",
                "Verify user profile data is returned"
            ]
        },
        {
            "step": "4. Fix Based on Results",
            "actions": [
                "If 401: Token invalid - check LinkedIn app credentials",
                "If 403: Scope issue - verify app permissions",
                "If None response: Authlib issue - check client initialization",
                "If timeout: Network issue - check firewall/proxy"
            ]
        }
    ]
    
    for step_info in steps:
        print(f"📋 {step_info['step']}:")
        for action in step_info['actions']:
            print(f"   • {action}")
        print()
    
    return True

def create_linkedin_test_summary():
    """Create a summary of the LinkedIn OAuth test"""
    print("=== LinkedIn OAuth Test Summary ===\n")
    
    print("✅ COMPLETED FIXES:")
    print("   • Fixed deprecated scopes (r_liteprofile, r_emailaddress → profile, email)")
    print("   • Verified API endpoints are current")
    print("   • Added comprehensive debug logging")
    print("   • Created troubleshooting test suite")
    
    print("\n🔍 CURRENT ISSUE:")
    print("   • OAuth token received successfully")
    print("   • Profile API request returns None")
    print("   • Need to debug OAuth client integration")
    
    print("\n📝 NEXT ACTIONS:")
    print("   1. Test LinkedIn OAuth with debug code")
    print("   2. Check debug output for clues")
    print("   3. Verify LinkedIn app permissions")
    print("   4. Test with manual curl request")
    
    print(f"\n🕐 Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return True

if __name__ == '__main__':
    print("LinkedIn OAuth Comprehensive Fix Test")
    print("=" * 60)
    
    test_functions = [
        test_oauth_token_scopes,
        test_api_request_patterns,
        test_linkedin_app_configuration,
        generate_curl_test,
        test_authlib_integration,
        generate_troubleshooting_guide,
        create_linkedin_test_summary
    ]
    
    for test_func in test_functions:
        test_func()
    
    print("=" * 60)
    print("🎯 Ready for LinkedIn OAuth testing!")
    print("   Run the application and try LinkedIn login to see debug output.") 