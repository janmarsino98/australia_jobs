#!/usr/bin/env python3
"""
Test script to verify LinkedIn OAuth user data storage
This script tests the find_or_create_oauth_user function with sample LinkedIn data
"""

import sys
import os
from datetime import datetime
from pprint import pprint

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our models and auth functions
from models import User, UserProfile, OAuthProvider, OAuthAccount
from auth.auth import find_or_create_oauth_user
from extensions import mongo

def test_linkedin_user_creation():
    """Test creating a LinkedIn OAuth user with comprehensive data"""
    
    print("=== Testing LinkedIn OAuth User Creation ===\n")
    
    # Sample LinkedIn userinfo data (as returned by /v2/userinfo endpoint)
    sample_linkedin_data = {
        "sub": "linkedin_test_user_12345",
        "name": "John Doe",
        "given_name": "John",
        "family_name": "Doe", 
        "email": "john.doe@example.com",
        "email_verified": True,
        "locale": {
            "country": "US",
            "language": "en"
        },
        "picture": "https://media.licdn.com/dms/image/C4D03AQH_sample_profile_pic/profile-displayphoto-shrink_100_100/0/1516831234567?e=1234567890&v=beta&t=sample_token"
    }
    
    print("Sample LinkedIn Data:")
    pprint(sample_linkedin_data)
    print()
    
    # Test parameters
    email = sample_linkedin_data["email"]
    name = sample_linkedin_data["name"]
    provider = "linkedin"
    provider_id = sample_linkedin_data["sub"]
    
    print(f"Testing with:")
    print(f"  Email: {email}")
    print(f"  Name: {name}")
    print(f"  Provider: {provider}")
    print(f"  Provider ID: {provider_id}")
    print()
    
    # Call the function
    try:
        result = find_or_create_oauth_user(
            email=email,
            name=name, 
            provider=provider,
            provider_id=provider_id,
            oauth_data=sample_linkedin_data
        )
        
        if result:
            print("✅ User creation/update successful!")
            print(f"User ID: {result['_id']}")
            print()
            
            # Check what was stored in the database
            users_db = mongo.db.users
            stored_user = users_db.find_one({"_id": result["_id"]})
            
            if stored_user:
                print("📊 Data stored in database:")
                print(f"  Name: {stored_user.get('name')}")
                print(f"  Email: {stored_user.get('email')}")
                print(f"  Role: {stored_user.get('role')}")
                print(f"  Email Verified: {stored_user.get('email_verified')}")
                print()
                
                # Check profile data
                profile = stored_user.get('profile', {})
                if profile:
                    print("👤 Profile Data:")
                    print(f"  First Name: {profile.get('first_name')}")
                    print(f"  Last Name: {profile.get('last_name')}")
                    print(f"  Display Name: {profile.get('display_name')}")
                    print(f"  Profile Picture: {profile.get('profile_picture')}")
                    print()
                else:
                    print("❌ No profile data found!")
                    print()
                
                # Check OAuth accounts
                oauth_accounts = stored_user.get('oauth_accounts', {})
                if oauth_accounts:
                    print("🔗 OAuth Accounts:")
                    for provider_name, account_data in oauth_accounts.items():
                        print(f"  {provider_name}:")
                        print(f"    Provider ID: {account_data.get('provider_id')}")
                        print(f"    Connected At: {account_data.get('connected_at')}")
                        print(f"    Last Used: {account_data.get('last_used')}")
                        profile_data = account_data.get('profile_data')
                        if profile_data:
                            print(f"    Profile Data Keys: {list(profile_data.keys())}")
                        print()
                else:
                    print("❌ No OAuth accounts found!")
                    print()
                
                # Verify specific fields from LinkedIn
                expected_fields = {
                    'profile.first_name': sample_linkedin_data['given_name'],
                    'profile.last_name': sample_linkedin_data['family_name'],
                    'profile.profile_picture': sample_linkedin_data['picture'],
                    'name': sample_linkedin_data['name'],
                    'email': sample_linkedin_data['email']
                }
                
                print("🧪 Field Verification:")
                all_correct = True
                for field_path, expected_value in expected_fields.items():
                    if '.' in field_path:
                        # Nested field
                        parts = field_path.split('.')
                        actual_value = stored_user
                        for part in parts:
                            actual_value = actual_value.get(part, {}) if actual_value else {}
                        if not isinstance(actual_value, dict):
                            pass  # We have a value
                        else:
                            actual_value = None
                    else:
                        # Top-level field
                        actual_value = stored_user.get(field_path)
                    
                    if actual_value == expected_value:
                        print(f"  ✅ {field_path}: {actual_value}")
                    else:
                        print(f"  ❌ {field_path}: Expected '{expected_value}', got '{actual_value}'")
                        all_correct = False
                
                print()
                if all_correct:
                    print("🎉 All fields stored correctly!")
                else:
                    print("⚠️  Some fields were not stored correctly.")
                
            else:
                print("❌ User not found in database after creation!")
                
        else:
            print("❌ User creation failed!")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()


def test_user_model_validation():
    """Test the Pydantic User model validation"""
    
    print("\n=== Testing Pydantic User Model ===\n")
    
    try:
        # Test creating a User model instance
        user = User(
            email="test@example.com",
            name="Test User",
            role="job_seeker"
        )
        
        print("✅ Basic User model creation successful")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.name}")
        print(f"  Role: {user.role}")
        print()
        
        # Test adding OAuth account
        oauth_data = {
            "sub": "test_123",
            "given_name": "Test",
            "family_name": "User",
            "picture": "https://example.com/pic.jpg"
        }
        
        user.add_oauth_account(OAuthProvider.LINKEDIN, "test_123", oauth_data)
        user.update_profile_from_oauth(OAuthProvider.LINKEDIN, oauth_data)
        
        print("✅ OAuth account and profile update successful")
        print(f"  First Name: {user.profile.first_name}")
        print(f"  Last Name: {user.profile.last_name}")
        print(f"  Profile Picture: {user.profile.profile_picture}")
        print(f"  OAuth Accounts: {list(user.oauth_accounts.keys())}")
        print()
        
        # Test conversion to dict
        user_dict = user.to_dict()
        print("✅ User model to dict conversion successful")
        print(f"  Dict keys: {list(user_dict.keys())}")
        print()
        
        # Test conversion from dict
        user_from_dict = User.from_dict(user_dict)
        print("✅ User model from dict conversion successful")
        print(f"  Name: {user_from_dict.name}")
        print(f"  First Name: {user_from_dict.profile.first_name}")
        print()
        
    except Exception as e:
        print(f"❌ Error during model test: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("🚀 Starting LinkedIn OAuth User Data Tests")
    print("=" * 50)
    
    # Test 1: User model validation
    test_user_model_validation()
    
    # Test 2: LinkedIn user creation (requires MongoDB connection)
    try:
        # This will only work if MongoDB is running and configured
        test_linkedin_user_creation()
    except Exception as e:
        print(f"⚠️  Could not test database operations (MongoDB may not be running): {e}")
    
    print("\n" + "=" * 50)
    print("�� Tests completed!") 