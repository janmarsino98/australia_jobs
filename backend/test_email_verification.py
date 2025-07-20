#!/usr/bin/env python3
"""
Email Verification Flow Test Script
==================================

This script tests the complete email verification flow for Australia Jobs.
Run this after configuring email settings to ensure everything works.
"""

import os
import sys
import json
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_email_service():
    """Test email service functionality"""
    print("🧪 Testing Email Service...")
    
    try:
        from email_service import (
            create_email_verification_token,
            send_email_verification,
            verify_email_verification_token,
            mark_token_as_used
        )
        
        # Test token creation
        test_email = "test@example.com"
        test_name = "Test User"
        
        print(f"  📧 Creating verification token for {test_email}...")
        token = create_email_verification_token(test_email)
        
        if not token:
            print("  ❌ Failed to create verification token")
            return False
        
        print(f"  ✅ Token created: {token[:8]}...")
        
        # Test token verification
        print("  🔍 Verifying token...")
        token_data = verify_email_verification_token(token)
        
        if not token_data:
            print("  ❌ Failed to verify token")
            return False
        
        print("  ✅ Token verified successfully")
        print(f"  📋 Token data: {json.dumps({k: str(v) for k, v in token_data.items()}, indent=2)}")
        
        # Test email sending (if SMTP is configured)
        if os.getenv('MAIL_USERNAME') and os.getenv('MAIL_PASSWORD'):
            print(f"  📤 Sending verification email to {test_email}...")
            success, message = send_email_verification(test_email, test_name, token)
            
            if success:
                print("  ✅ Verification email sent successfully!")
                print("  💡 Check your email inbox for the verification email")
            else:
                print(f"  ⚠️  Failed to send email: {message}")
                print("  💡 This is likely due to SMTP configuration issues")
        else:
            print("  ⚠️  SMTP not configured - skipping email sending test")
            print("  💡 Run setup_email.py to configure email settings")
        
        # Test marking token as used
        print("  ✋ Marking token as used...")
        success = mark_token_as_used(token)
        
        if success:
            print("  ✅ Token marked as used")
        else:
            print("  ❌ Failed to mark token as used")
            return False
        
        # Test verifying used token (should fail)
        print("  🔍 Verifying used token (should fail)...")
        used_token_data = verify_email_verification_token(token)
        
        if used_token_data:
            print("  ❌ Used token was still valid (this shouldn't happen)")
            return False
        else:
            print("  ✅ Used token correctly rejected")
        
        print("  🎉 All email service tests passed!")
        return True
        
    except ImportError as e:
        print(f"  ❌ Failed to import email service: {e}")
        print("  💡 Make sure Flask app is properly configured")
        return False
    except Exception as e:
        print(f"  ❌ Email service test failed: {e}")
        return False

def test_database_connection():
    """Test MongoDB connection"""
    print("🗄️  Testing Database Connection...")
    
    try:
        from extensions import mongo
        from server import create_app
        
        app = create_app()
        with app.app_context():
            # Test connection
            mongo.db.command('ping')
            print("  ✅ MongoDB connection successful")
            
            # Test tokens collection
            tokens_count = mongo.db.tokens.count_documents({})
            print(f"  📊 Found {tokens_count} tokens in database")
            
            return True
            
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        print("  💡 Make sure MongoDB is running and MONGO_URI is configured")
        return False

def test_email_configuration():
    """Test email configuration"""
    print("⚙️  Testing Email Configuration...")
    
    required_vars = [
        'MAIL_SERVER',
        'MAIL_PORT', 
        'MAIL_USE_TLS',
        'MAIL_USERNAME',
        'MAIL_PASSWORD',
        'MAIL_DEFAULT_SENDER'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            # Mask sensitive information
            if 'PASSWORD' in var:
                print(f"  ✅ {var}: {'*' * len(value)}")
            else:
                print(f"  ✅ {var}: {value}")
    
    if missing_vars:
        print(f"  ❌ Missing configuration: {', '.join(missing_vars)}")
        print("  💡 Run setup_email.py to configure these settings")
        return False
    else:
        print("  ✅ All email configuration variables are set")
        return True

def main():
    print("🚀 Australia Jobs Email Verification Test")
    print("=" * 50)
    print(f"📅 Test started at: {datetime.now()}")
    print()
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    all_tests_passed = True
    
    # Test 1: Email Configuration
    if not test_email_configuration():
        all_tests_passed = False
        print("\n💡 Configure email settings first with: python setup_email.py")
    
    print()
    
    # Test 2: Database Connection
    if not test_database_connection():
        all_tests_passed = False
    
    print()
    
    # Test 3: Email Service
    if not test_email_service():
        all_tests_passed = False
    
    print()
    print("=" * 50)
    
    if all_tests_passed:
        print("🎉 All tests passed! Email verification is working correctly.")
        print("\n✅ Next steps:")
        print("   1. Start your Flask server: python server.py")
        print("   2. Start your frontend: npm run dev")
        print("   3. Test registration with email verification")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("\n🔧 Common solutions:")
        print("   1. Run: python setup_email.py (to configure email)")
        print("   2. Make sure MongoDB is running")
        print("   3. Make sure Redis is running")
        print("   4. Check that all dependencies are installed")

if __name__ == "__main__":
    main()