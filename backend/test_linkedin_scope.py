#!/usr/bin/env python3
"""
Simple test to check LinkedIn OAuth scope configuration
This test focuses specifically on identifying the scope issue causing LinkedIn OAuth failures.
"""

import sys
import os

def test_linkedin_scope_configuration():
    """Test to verify LinkedIn OAuth scope configuration"""
    print("=== LinkedIn OAuth Scope Configuration Test ===\n")
    
    # Read the current auth.py file to check LinkedIn scope configuration
    auth_file_path = os.path.join(os.path.dirname(__file__), 'auth', 'auth.py')
    
    if not os.path.exists(auth_file_path):
        print("❌ Error: auth.py file not found")
        return False
    
    with open(auth_file_path, 'r') as f:
        auth_content = f.read()
    
    # Find LinkedIn OAuth configuration
    linkedin_config_start = auth_content.find('linkedin = oauth.register(')
    if linkedin_config_start == -1:
        print("❌ Error: LinkedIn OAuth configuration not found")
        return False
    
    # Extract the LinkedIn configuration section
    brace_count = 0
    config_start = linkedin_config_start
    config_end = config_start
    
    for i, char in enumerate(auth_content[config_start:]):
        if char == '(':
            brace_count += 1
        elif char == ')':
            brace_count -= 1
            if brace_count == 0:
                config_end = config_start + i + 1
                break
    
    linkedin_config = auth_content[config_start:config_end]
    print("Current LinkedIn OAuth configuration:")
    print("-" * 40)
    print(linkedin_config)
    print("-" * 40)
    print()
    
    # Check for deprecated scopes
    issues_found = []
    
    if 'r_emailaddress' in linkedin_config:
        issues_found.append("❌ FOUND DEPRECATED SCOPE: 'r_emailaddress' - This should be 'email'")
    
    if 'r_liteprofile' in linkedin_config:
        issues_found.append("❌ FOUND DEPRECATED SCOPE: 'r_liteprofile' - This should be 'profile'")
    
    # Check for correct scopes
    current_scopes = []
    if 'scope' in linkedin_config:
        # Extract scope value
        scope_start = linkedin_config.find("'scope':")
        if scope_start != -1:
            scope_line_start = linkedin_config.find("'", scope_start + 8)
            scope_line_end = linkedin_config.find("'", scope_line_start + 1)
            if scope_line_start != -1 and scope_line_end != -1:
                scope_value = linkedin_config[scope_line_start + 1:scope_line_end]
                current_scopes = [s.strip() for s in scope_value.split()]
                print(f"Current scopes: {current_scopes}")
    
    # Report findings
    print("\n=== Test Results ===")
    
    if issues_found:
        print("🔍 Issues found:")
        for issue in issues_found:
            print(f"  {issue}")
        print()
        print("🔧 Recommended fix:")
        print("  Replace 'r_emailaddress' with 'email'")
        print("  Replace 'r_liteprofile' with 'profile'")
        print("  Updated scope should be: 'profile email'")
        return False
    else:
        if 'profile' in current_scopes and 'email' in current_scopes:
            print("✅ LinkedIn scope configuration looks correct!")
            return True
        else:
            print("⚠️  LinkedIn scope configuration needs verification")
            print(f"   Current scopes: {current_scopes}")
            print("   Expected scopes: ['profile', 'email']")
            return False


def test_linkedin_api_endpoints():
    """Test to verify LinkedIn API endpoints are current"""
    print("\n=== LinkedIn API Endpoints Test ===\n")
    
    auth_file_path = os.path.join(os.path.dirname(__file__), 'auth', 'auth.py')
    
    with open(auth_file_path, 'r') as f:
        auth_content = f.read()
    
    # Check API endpoints
    issues_found = []
    
    # Current LinkedIn API v2 endpoints
    if 'https://api.linkedin.com/v2/me' not in auth_content:
        issues_found.append("❌ Profile endpoint might be outdated")
    
    if 'https://api.linkedin.com/v2/emailAddress' not in auth_content:
        issues_found.append("❌ Email endpoint might be outdated")
    
    if issues_found:
        print("🔍 API endpoint issues found:")
        for issue in issues_found:
            print(f"  {issue}")
        return False
    else:
        print("✅ LinkedIn API endpoints look current!")
        return True


def test_error_from_logs():
    """Test to analyze the specific error from logs"""
    print("\n=== Error Analysis from Logs ===\n")
    
    error_message = "Scope 'r_emailaddress' is not authorized for your application"
    
    print(f"Error message: {error_message}")
    print()
    print("🔍 Analysis:")
    print("  - LinkedIn is rejecting the 'r_emailaddress' scope")
    print("  - This scope was deprecated in LinkedIn API v2")
    print("  - The current equivalent scope is 'email'")
    print()
    print("🔧 Solution:")
    print("  1. Replace 'r_emailaddress' with 'email' in OAuth scope")
    print("  2. Replace 'r_liteprofile' with 'profile' in OAuth scope")
    print("  3. Update scope from 'r_liteprofile r_emailaddress' to 'profile email'")
    
    return True


if __name__ == '__main__':
    print("LinkedIn OAuth Debugging Test Suite")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Run tests
    test_results = [
        test_linkedin_scope_configuration(),
        test_linkedin_api_endpoints(),
        test_error_from_logs()
    ]
    
    all_tests_passed = all(test_results)
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    print(f"Tests passed: {sum(test_results)}/{len(test_results)}")
    
    if not all_tests_passed:
        print("\n🚨 ACTION REQUIRED:")
        print("LinkedIn OAuth configuration needs to be updated!")
        print("The deprecated scopes are causing authentication failures.")
    else:
        print("\n✅ All tests passed!")
    
    print("=" * 50) 