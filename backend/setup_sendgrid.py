#!/usr/bin/env python3
"""
SendGrid Email Configuration Setup for Australia Jobs
====================================================

This script helps you set up SendGrid for professional email sending
with custom sender addresses like noreply@australiajobs.com
"""

import os
import getpass

def setup_sendgrid():
    """Setup SendGrid configuration"""
    print("🚀 SendGrid Setup for Australia Jobs")
    print("=" * 40)
    print()
    print("SendGrid allows you to send emails from custom addresses")
    print("like noreply@australiajobs.com (unlike Gmail)")
    print()
    print("Steps to get started:")
    print("1. Sign up at https://sendgrid.com (free tier: 100 emails/day)")
    print("2. Verify your sender email or domain")
    print("3. Create an API key")
    print("4. Use this script to configure it")
    print()
    
    # Get API key
    api_key = getpass.getpass("Enter your SendGrid API Key: ").strip()
    if not api_key:
        print("API key is required!")
        return None
    
    # Get sender email
    print()
    sender_email = input("Enter sender email (e.g., noreply@australiajobs.com): ").strip()
    if not sender_email:
        sender_email = "noreply@australiajobs.com"
    
    print()
    print("⚠️  IMPORTANT: You must verify this sender email in SendGrid:")
    print(f"   1. Go to SendGrid → Settings → Sender Authentication")
    print(f"   2. Add and verify: {sender_email}")
    print(f"   3. Or verify your domain: australiajobs.com")
    print()
    
    verified = input("Have you verified this sender email in SendGrid? (y/N): ").strip().lower()
    if verified != 'y':
        print()
        print("❌ Please verify your sender email in SendGrid first!")
        print("   Visit: https://app.sendgrid.com/settings/sender_auth")
        return None
    
    return {
        'MAIL_SERVER': 'smtp.sendgrid.net',
        'MAIL_PORT': '587',
        'MAIL_USE_TLS': 'True',
        'MAIL_USERNAME': 'apikey',
        'MAIL_PASSWORD': api_key,
        'MAIL_DEFAULT_SENDER': sender_email,
        'FRONTEND_URL': 'http://localhost:5173'
    }

def write_env_file(config):
    """Write configuration to .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    # Read existing .env if it exists
    existing_config = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    key, value = line.strip().split('=', 1)
                    existing_config[key] = value
    
    # Update with new config
    existing_config.update(config)
    
    # Write updated config
    with open(env_path, 'w') as f:
        f.write("# Australia Jobs Environment Configuration\n")
        f.write("# SendGrid Email Configuration\n\n")
        
        # Write email config
        f.write("# SendGrid SMTP Configuration\n")
        for key in ['MAIL_SERVER', 'MAIL_PORT', 'MAIL_USE_TLS', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_DEFAULT_SENDER', 'FRONTEND_URL']:
            if key in existing_config:
                f.write(f"{key}={existing_config[key]}\n")
        f.write("\n")
        
        # Write other existing config
        f.write("# Other Configuration\n")
        for key, value in existing_config.items():
            if not key.startswith('MAIL_') and key != 'FRONTEND_URL':
                f.write(f"{key}={value}\n")
    
    print(f"\n✅ SendGrid configuration saved to {env_path}")

def test_sendgrid():
    """Test SendGrid configuration"""
    print("\n🧪 Testing SendGrid Configuration...")
    
    try:
        from email_service import send_email
        
        test_email = input("Enter email to send test message to: ").strip()
        if not test_email:
            print("Skipping test...")
            return
        
        print("Sending test email via SendGrid...")
        success, message = send_email(
            to=test_email,
            subject="Australia Jobs - SendGrid Test",
            html_body="""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">🎉 SendGrid is Working!</h2>
                <p>Congratulations! Your SendGrid configuration is working correctly.</p>
                <p><strong>Benefits of SendGrid:</strong></p>
                <ul>
                    <li>✅ Custom sender addresses (noreply@australiajobs.com)</li>
                    <li>✅ Professional email delivery</li>
                    <li>✅ Better deliverability than Gmail</li>
                    <li>✅ Email analytics and tracking</li>
                </ul>
                <p>Your email verification system is now ready!</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    This email was sent via SendGrid from Australia Jobs
                </p>
            </div>
            """
        )
        
        if success:
            print("✅ SendGrid test email sent successfully!")
            print("📧 Check your inbox to confirm custom sender address")
        else:
            print(f"❌ SendGrid test failed: {message}")
            
    except Exception as e:
        print(f"❌ Error testing SendGrid: {e}")

def main():
    config = setup_sendgrid()
    if not config:
        return
    
    write_env_file(config)
    
    print("\n🎉 SendGrid configuration complete!")
    print("\n📋 Next steps:")
    print("1. Restart your Flask server")
    print("2. Test registration with email verification")
    print("3. Emails will now come from your custom sender address!")
    
    test_choice = input("\nSend a test email now? (y/N): ").strip().lower()
    if test_choice == 'y':
        test_sendgrid()

if __name__ == "__main__":
    main()