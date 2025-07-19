"""
Email service module for sending various types of emails
"""
from flask import render_template_string, current_app
from flask_mail import Message
from extensions import mail
import secrets
import string
from datetime import datetime, timedelta
from extensions import mongo
import os

def generate_secure_token(length=32):
    """Generate a cryptographically secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_email(to, subject, html_body, text_body=None):
    """Send an email"""
    try:
        msg = Message(
            subject=subject,
            recipients=[to] if isinstance(to, str) else to,
            html=html_body,
            body=text_body or html_body
        )
        mail.send(msg)
        return True, "Email sent successfully"
    except Exception as e:
        print(f"Error sending email: {e}")
        return False, str(e)

def create_password_reset_token(email):
    """Create a password reset token and store it in database"""
    try:
        token = generate_secure_token()
        expiry_time = datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
        
        # Store token in database
        token_data = {
            "email": email,
            "token": token,
            "type": "password_reset",
            "expires_at": expiry_time,
            "used": False,
            "created_at": datetime.utcnow()
        }
        
        mongo.db.tokens.insert_one(token_data)
        return token
    except Exception as e:
        print(f"Error creating password reset token: {e}")
        return None

def verify_password_reset_token(token):
    """Verify and return token data if valid"""
    try:
        token_data = mongo.db.tokens.find_one({
            "token": token,
            "type": "password_reset",
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        return token_data
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

def mark_token_as_used(token):
    """Mark a token as used"""
    try:
        mongo.db.tokens.update_one(
            {"token": token},
            {"$set": {"used": True, "used_at": datetime.utcnow()}}
        )
        return True
    except Exception as e:
        print(f"Error marking token as used: {e}")
        return False

def get_password_reset_email_template():
    """Get the password reset email template"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Australia Jobs</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f8fafc; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #2563eb; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .security-note { 
                background-color: #fef3c7; 
                border-left: 4px solid #f59e0b; 
                padding: 15px; 
                margin: 20px 0; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Australia Jobs</h1>
                <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
                <h3>Hello {{ name }},</h3>
                
                <p>We received a request to reset your password for your Australia Jobs account associated with {{ email }}.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <a href="{{ reset_url }}" class="button">Reset Password</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb;">{{ reset_url }}</p>
                
                <div class="security-note">
                    <strong>Security Notice:</strong>
                    <ul>
                        <li>This link will expire in 24 hours</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>For security, this link can only be used once</li>
                    </ul>
                </div>
                
                <p>If you're having trouble clicking the button, copy and paste the URL into your web browser.</p>
                
                <p>Best regards,<br>The Australia Jobs Team</p>
            </div>
            
            <div class="footer">
                <p>This email was sent to {{ email }}. If you didn't request this password reset, please ignore this email.</p>
                <p>&copy; 2024 Australia Jobs. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_password_reset_email(email, name, token):
    """Send password reset email"""
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/auth/reset-password?token={token}"
        
        template = get_password_reset_email_template()
        html_body = render_template_string(template, 
            name=name, 
            email=email, 
            reset_url=reset_url,
            token=token
        )
        
        subject = "Reset Your Australia Jobs Password"
        
        success, message = send_email(email, subject, html_body)
        return success, message
        
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False, str(e)

def get_welcome_email_template():
    """Get the welcome email template"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Australia Jobs</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f8fafc; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #2563eb; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .feature-list { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Australia Jobs!</h1>
            </div>
            
            <div class="content">
                <h3>Hello {{ name }},</h3>
                
                <p>Welcome to Australia Jobs! We're excited to have you join our community of job seekers and employers.</p>
                
                <div class="feature-list">
                    <h4>What you can do now:</h4>
                    <ul>
                        <li>🔍 Search thousands of job opportunities</li>
                        <li>📄 Upload and optimize your resume</li>
                        <li>🎯 Set up personalized job alerts</li>
                        <li>💼 Apply to jobs with one click</li>
                        <li>📊 Track your application progress</li>
                    </ul>
                </div>
                
                <a href="{{ dashboard_url }}" class="button">Get Started</a>
                
                <p>If you have any questions or need help getting started, feel free to contact our support team.</p>
                
                <p>Best regards,<br>The Australia Jobs Team</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Australia Jobs. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_welcome_email(email, name):
    """Send welcome email to new users"""
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        dashboard_url = f"{frontend_url}/dashboard"
        
        template = get_welcome_email_template()
        html_body = render_template_string(template, 
            name=name, 
            email=email, 
            dashboard_url=dashboard_url
        )
        
        subject = "Welcome to Australia Jobs!"
        
        success, message = send_email(email, subject, html_body)
        return success, message
        
    except Exception as e:
        print(f"Error sending welcome email: {e}")
        return False, str(e)

def create_email_verification_token(email):
    """Create an email verification token and store it in database"""
    try:
        token = generate_secure_token()
        expiry_time = datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
        
        # Store token in database
        token_data = {
            "email": email,
            "token": token,
            "type": "email_verification",
            "expires_at": expiry_time,
            "used": False,
            "created_at": datetime.utcnow()
        }
        
        mongo.db.tokens.insert_one(token_data)
        return token
    except Exception as e:
        print(f"Error creating email verification token: {e}")
        return None

def verify_email_verification_token(token):
    """Verify and return email verification token data if valid"""
    try:
        token_data = mongo.db.tokens.find_one({
            "token": token,
            "type": "email_verification",
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        return token_data
    except Exception as e:
        print(f"Error verifying email verification token: {e}")
        return None

def get_email_verification_template():
    """Get the email verification email template"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Australia Jobs</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f8fafc; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #10b981; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .verification-note { 
                background-color: #ecfdf5; 
                border-left: 4px solid #10b981; 
                padding: 15px; 
                margin: 20px 0; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Australia Jobs</h1>
                <h2>Verify Your Email Address</h2>
            </div>
            
            <div class="content">
                <h3>Hello {{ name }},</h3>
                
                <p>Thank you for signing up for Australia Jobs! To complete your registration and start applying for jobs, please verify your email address.</p>
                
                <p>Click the button below to verify your email:</p>
                
                <a href="{{ verification_url }}" class="button">Verify Email Address</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb;">{{ verification_url }}</p>
                
                <div class="verification-note">
                    <strong>Important:</strong>
                    <ul>
                        <li>This verification link will expire in 24 hours</li>
                        <li>You must verify your email to access all features</li>
                        <li>If you didn't create this account, please ignore this email</li>
                    </ul>
                </div>
                
                <p>Once verified, you'll be able to:</p>
                <ul>
                    <li>Apply for jobs</li>
                    <li>Save job searches</li>
                    <li>Receive job alerts</li>
                    <li>Upload your resume</li>
                </ul>
                
                <p>If you're having trouble clicking the button, copy and paste the URL into your web browser.</p>
                
                <p>Welcome to Australia Jobs!<br>The Australia Jobs Team</p>
            </div>
            
            <div class="footer">
                <p>This email was sent to {{ email }}. If you didn't sign up for Australia Jobs, please ignore this email.</p>
                <p>&copy; 2024 Australia Jobs. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_email_verification(email, name, token):
    """Send email verification email"""
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        verification_url = f"{frontend_url}/auth/verify-email?token={token}"
        
        template = get_email_verification_template()
        html_body = render_template_string(template, 
            name=name, 
            email=email, 
            verification_url=verification_url,
            token=token
        )
        
        subject = "Verify Your Email Address - Australia Jobs"
        
        success, message = send_email(email, subject, html_body)
        return success, message
        
    except Exception as e:
        print(f"Error sending email verification: {e}")
        return False, str(e) 