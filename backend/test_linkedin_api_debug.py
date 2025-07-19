#!/usr/bin/env python3
"""
Debug test for LinkedIn API request issues
This test helps identify why the profile API request is returning None.
"""

import os
import sys
import requests

def test_linkedin_api_request_debug():
    """Debug LinkedIn API request issues"""
    print("=== LinkedIn API Request Debug Test ===\n")
    
    # Read auth.py to check the current implementation
    auth_file_path = os.path.join(os.path.dirname(__file__), 'auth', 'auth.py')
    with open(auth_file_path, 'r') as f:
        auth_content = f.read()
    
    print("1. Checking OAuth client configuration...")
    
    # Check for potential issues in the OAuth configuration
    issues_found = []
    
    # Check if the OAuth client is being used correctly
    if 'oauth.linkedin.get(' not in auth_content:
        issues_found.append("❌ oauth.linkedin.get() call not found")
    else:
        print("✅ oauth.linkedin.get() call found")
    
    # Check the profile endpoint URL
    if 'https://api.linkedin.com/v2/me' not in auth_content:
        issues_found.append("❌ Profile endpoint URL not found")
    else:
        print("✅ Profile endpoint URL found")
    
    # Check for proper error handling
    if 'profile_resp.status_code' not in auth_content:
        issues_found.append("❌ Profile response status check not found")
    else:
        print("✅ Profile response status check found")
    
    print("\n2. Analyzing potential causes for None response...")
    
    potential_causes = [
        "OAuth client not properly initialized",
        "Access token not being passed correctly",
        "LinkedIn API endpoint changed",
        "Network/connection issue",
        "Token doesn't have required permissions"
    ]
    
    for i, cause in enumerate(potential_causes, 1):
        print(f"   {i}. {cause}")
    
    print("\n3. Checking LinkedIn OAuth client initialization...")
    
    # Look for OAuth client initialization
    if 'oauth.register(' in auth_content and 'linkedin' in auth_content:
        print("✅ LinkedIn OAuth client registration found")
    else:
        issues_found.append("❌ LinkedIn OAuth client registration not found")
    
    # Check if the client is being assigned to a variable
    if 'linkedin = oauth.register(' in auth_content:
        print("✅ LinkedIn client assignment found")
    else:
        print("⚠️  LinkedIn client assignment not found - might be using oauth.linkedin directly")
    
    print("\n4. Recommended debugging steps...")
    
    debug_recommendations = [
        "Add debug logging before the API request",
        "Check if oauth.linkedin exists",
        "Verify the access token is valid",
        "Test the API endpoint manually with curl",
        "Add exception handling around the API request"
    ]
    
    for i, rec in enumerate(debug_recommendations, 1):
        print(f"   {i}. {rec}")
    
    if issues_found:
        print(f"\n❌ Issues found: {len(issues_found)}")
        for issue in issues_found:
            print(f"   • {issue}")
        return False
    else:
        print("\n✅ Basic configuration looks correct")
        print("   The issue might be runtime-related or token permissions")
        return True


def test_manual_api_request():
    """Test manual LinkedIn API request format"""
    print("\n=== Manual API Request Test ===\n")
    
    print("📋 To manually test the LinkedIn API:")
    print("   1. Get your access token from the OAuth callback logs")
    print("   2. Test with curl:")
    print("      ```")
    print("      curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\")
    print("           'https://api.linkedin.com/v2/me'")
    print("      ```")
    print("   3. Check the response for errors")
    
    print("\n📋 Expected LinkedIn API response format:")
    print("   ```json")
    print("   {")
    print("     \"id\": \"abc123\",")
    print("     \"firstName\": {")
    print("       \"localized\": { \"en_US\": \"John\" },")
    print("       \"preferredLocale\": { \"country\": \"US\", \"language\": \"en\" }")
    print("     },")
    print("     \"lastName\": {")
    print("       \"localized\": { \"en_US\": \"Doe\" },")
    print("       \"preferredLocale\": { \"country\": \"US\", \"language\": \"en\" }")
    print("     }")
    print("   }")
    print("   ```")
    
    return True


def generate_debug_patch():
    """Generate a debug patch for the auth.py file"""
    print("\n=== Debug Patch Generation ===\n")
    
    print("🔧 Suggested debug additions to auth.py:")
    print("   Add these debug lines before the profile API request:")
    
    debug_code = '''
    # Debug: Check OAuth client and token
    print(f"Debug: OAuth client exists: {hasattr(oauth, 'linkedin')}")
    print(f"Debug: Token contents: {list(token.keys())}")
    print(f"Debug: Access token: {token.get('access_token')[:10]}..." if token.get('access_token') else 'None')
    
    # Debug: Test the API request with more error handling
    try:
        print("Debug: Making profile API request...")
        profile_resp = oauth.linkedin.get('https://api.linkedin.com/v2/me')
        print(f"Debug: Profile response object: {profile_resp}")
        print(f"Debug: Profile response type: {type(profile_resp)}")
        
        if profile_resp:
            print(f"Debug: Profile response status: {profile_resp.status_code}")
            print(f"Debug: Profile response headers: {dict(profile_resp.headers)}")
            print(f"Debug: Profile response text: {profile_resp.text[:200]}...")
        else:
            print("Debug: Profile response is None - OAuth client issue!")
            
    except Exception as e:
        print(f"Debug: Exception during API request: {e}")
        print(f"Debug: Exception type: {type(e)}")
    '''
    
    print(debug_code)
    
    return True


if __name__ == '__main__':
    print("LinkedIn API Debug Test Suite")
    print("=" * 50)
    
    test_results = [
        test_linkedin_api_request_debug(),
        test_manual_api_request(),
        generate_debug_patch()
    ]
    
    print("\n" + "=" * 50)
    print("DEBUG TEST SUMMARY:")
    print(f"Tests completed: {len(test_results)}")
    
    print("\n🔍 NEXT STEPS:")
    print("   1. Add debug code to auth.py (see patch above)")
    print("   2. Test LinkedIn OAuth again")
    print("   3. Check the debug output for clues")
    print("   4. Verify LinkedIn app permissions")
    
    print("=" * 50) 