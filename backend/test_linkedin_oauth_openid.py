#!/usr/bin/env python3
"""
LinkedIn OAuth OpenID Connect Implementation Test
Tests the updated LinkedIn OAuth implementation using OpenID Connect
"""

import os
import sys
import requests
from urllib.parse import urlencode

def test_linkedin_oauth_config():
    """Test LinkedIn OAuth configuration in auth.py"""
    print("=== Testing LinkedIn OAuth Configuration ===\n")
    
    # Check if environment variables are set
    client_id = os.getenv('LINKEDIN_OAUTH_CLIENT_ID')
    client_secret = os.getenv('LINKEDIN_OAUTH_CLIENT_SECRET')
    
    print("🔍 Environment Variables Check:")
    print(f"   LINKEDIN_OAUTH_CLIENT_ID: {'✅ Set' if client_id else '❌ Missing'}")
    print(f"   LINKEDIN_OAUTH_CLIENT_SECRET: {'✅ Set' if client_secret else '❌ Missing'}")
    
    if not client_id or not client_secret:
        print("\n❌ Missing LinkedIn OAuth credentials!")
        print("   Add them to your .env file:")
        print("   LINKEDIN_OAUTH_CLIENT_ID=your_client_id")
        print("   LINKEDIN_OAUTH_CLIENT_SECRET=your_client_secret")
        return False
    
    # Check auth.py configuration
    auth_file_path = os.path.join(os.path.dirname(__file__), 'auth', 'auth.py')
    
    if not os.path.exists(auth_file_path):
        print("❌ Error: auth.py file not found")
        return False
    
    with open(auth_file_path, 'r') as f:
        auth_content = f.read()
    
    print("\n🔍 Code Configuration Check:")
    
    # Check for correct scopes
    if "'scope': 'profile email'" in auth_content:
        print("   ✅ Correct modern scopes found (profile email)")
    elif 'openid profile email' in auth_content:
        print("   ⚠️  Full OpenID Connect scopes found")
        print("       Consider using 'profile email' to avoid JWT validation issues")
    elif 'r_liteprofile' in auth_content or 'r_emailaddress' in auth_content:
        print("   ❌ Deprecated scopes found!")
        print("       Update from: 'r_liteprofile r_emailaddress'")
        print("       Update to: 'profile email'")
        return False
    else:
        print("   ❌ No LinkedIn scopes found in configuration")
        print(f"       Debug: Searching for scopes in {len(auth_content)} characters")
        return False
    
    # Check for correct userinfo endpoint
    if 'https://api.linkedin.com/v2/userinfo' in auth_content:
        print("   ✅ Correct userinfo endpoint found")
    else:
        print("   ❌ Userinfo endpoint not found")
        print("       Should use: https://api.linkedin.com/v2/userinfo")
        return False
    
    # Check for deprecated endpoints
    if 'https://api.linkedin.com/v2/me' in auth_content and 'userinfo' not in auth_content:
        print("   ⚠️  Old profile endpoint found")
        print("       Consider replacing with userinfo endpoint")
    
    if 'emailAddress?q=members' in auth_content:
        print("   ⚠️  Old email endpoint found")
        print("       Should be replaced by userinfo endpoint")
    
    print("\n✅ LinkedIn OAuth configuration looks good!")
    return True


def test_linkedin_oauth_endpoints():
    """Test LinkedIn OAuth endpoints accessibility"""
    print("\n=== Testing LinkedIn OAuth Endpoints ===\n")
    
    endpoints = [
        {
            'name': 'Authorization Endpoint',
            'url': 'https://www.linkedin.com/oauth/v2/authorization',
            'method': 'GET',
            'expected_status': [200, 400]  # 400 is expected without proper params
        },
        {
            'name': 'Token Endpoint',
            'url': 'https://www.linkedin.com/oauth/v2/accessToken',
            'method': 'POST',
            'expected_status': [400, 401]  # Expected without proper credentials
        }
    ]
    
    all_accessible = True
    
    for endpoint in endpoints:
        try:
            print(f"🔍 Testing {endpoint['name']}...")
            
            if endpoint['method'] == 'GET':
                response = requests.get(endpoint['url'], timeout=10)
            else:
                response = requests.post(endpoint['url'], timeout=10)
            
            if response.status_code in endpoint['expected_status']:
                print(f"   ✅ Accessible (Status: {response.status_code})")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error: {e}")
            all_accessible = False
    
    return all_accessible


def generate_test_authorization_url():
    """Generate a test authorization URL"""
    print("\n=== Test Authorization URL ===\n")
    
    client_id = os.getenv('LINKEDIN_OAUTH_CLIENT_ID')
    if not client_id:
        print("❌ Cannot generate test URL - missing client ID")
        return None
    
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': 'http://localhost:5000/auth/linkedin/callback',
        'state': 'test_state_123',
        'scope': 'profile email'  # Reliable scopes without JWT complications
    }
    
    auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    
    print("🔗 Test Authorization URL:")
    print(f"   {auth_url}")
    print("\n📋 Manual Test Steps:")
    print("   1. Copy the URL above")
    print("   2. Open it in a browser")
    print("   3. You should see LinkedIn's authorization page")
    print("   4. The page should request 'profile' and 'email' permissions")
    print("   5. After authorization, you'll be redirected to your callback URL")
    
    return auth_url


def provide_setup_checklist():
    """Provide a setup checklist for LinkedIn OAuth"""
    print("\n=== LinkedIn Developer Portal Setup Checklist ===\n")
    
    checklist = [
        "✅ Created LinkedIn Developer Account",
        "✅ Created or selected LinkedIn Application",
        "✅ Added 'Sign in with LinkedIn using OpenID Connect' product",
        "✅ Added redirect URI: http://localhost:5000/auth/linkedin/callback",
        "✅ Copied Client ID to LINKEDIN_OAUTH_CLIENT_ID environment variable",
        "✅ Copied Client Secret to LINKEDIN_OAUTH_CLIENT_SECRET environment variable",
        "✅ Updated code to use 'profile email' scopes (reliable approach)",
        "✅ Updated code to use userinfo endpoint with fallback"
    ]
    
    print("📋 Required setup steps:")
    for item in checklist:
        print(f"   {item}")
    
    print("\n🔗 LinkedIn Developer Portal: https://developer.linkedin.com/")
    print("📖 Setup Guide: backend/LINKEDIN_OAUTH_SETUP.md")


def test_backend_server():
    """Test if backend server is running and OAuth endpoints are accessible"""
    print("\n=== Testing Backend Server ===\n")
    
    try:
        # Test LinkedIn login endpoint
        login_url = "http://localhost:5000/auth/linkedin/login"
        print(f"🔍 Testing LinkedIn login endpoint: {login_url}")
        
        response = requests.get(login_url, allow_redirects=False, timeout=5)
        
        if response.status_code == 302:
            print("   ✅ LinkedIn login endpoint working (redirect response)")
            redirect_url = response.headers.get('Location', '')
            if 'linkedin.com/oauth' in redirect_url:
                print("   ✅ Redirecting to LinkedIn OAuth correctly")
            else:
                print(f"   ⚠️  Unexpected redirect: {redirect_url}")
        elif response.status_code == 500:
            print("   ❌ Server error - check OAuth configuration")
            return False
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("   ❌ Backend server not running")
        print("       Start with: cd backend && python server.py")
        return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request error: {e}")
        return False


if __name__ == '__main__':
    print("LinkedIn OAuth OpenID Connect Implementation Test")
    print("=" * 60)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run all tests
    tests = [
        test_linkedin_oauth_config,
        test_linkedin_oauth_endpoints,
        test_backend_server
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results.append(False)
    
    # Generate test URL
    generate_test_authorization_url()
    
    # Show setup checklist
    provide_setup_checklist()
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print(f"Tests passed: {sum(results)}/{len(results)}")
    
    if all(results):
        print("\n🎉 All tests passed!")
        print("   Your LinkedIn OAuth implementation is ready to test")
        print("   Try the manual test steps above")
    else:
        print("\n🚨 Some tests failed!")
        print("   Follow the LinkedIn OAuth Setup Guide:")
        print("   backend/LINKEDIN_OAUTH_SETUP.md")
    
    print("=" * 60) 