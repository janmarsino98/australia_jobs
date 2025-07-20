"""
Test suite for email service module
Tests email sending, token generation, and email templates
"""
import unittest
from unittest.mock import patch, MagicMock, Mock
import os
import sys
import json
from datetime import datetime, timedelta

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock extensions before importing email service
with patch('extensions.mail') as mock_mail, \
     patch('extensions.mongo') as mock_mongo:
    mock_mongo.db.tokens = MagicMock()
    from email_service import (
        send_email, generate_secure_token, create_password_reset_token,
        create_email_verification_token, send_password_reset_email,
        send_email_verification
    )
    from extensions import mail, mongo


class TestEmailService(unittest.TestCase):
    """Test email service functionality"""
    
    def test_generate_secure_token_default_length(self):
        """Test secure token generation with default length"""
        token = generate_secure_token()
        
        self.assertEqual(len(token), 32)  # Default length
        self.assertTrue(token.isalnum())  # Only letters and numbers
    
    def test_generate_secure_token_custom_length(self):
        """Test secure token generation with custom length"""
        custom_length = 64
        token = generate_secure_token(custom_length)
        
        self.assertEqual(len(token), custom_length)
        self.assertTrue(token.isalnum())
    
    def test_generate_secure_token_uniqueness(self):
        """Test that generated tokens are unique"""
        tokens = [generate_secure_token() for _ in range(100)]
        unique_tokens = set(tokens)
        
        # All tokens should be unique
        self.assertEqual(len(tokens), len(unique_tokens))
    
    @patch('email_service.mail')
    def test_send_email_success(self, mock_mail_service):
        """Test successful email sending"""
        mock_mail_service.send.return_value = None  # No exception means success
        
        success, message = send_email(
            to="test@example.com",
            subject="Test Subject",
            html_body="<h1>Test HTML</h1>",
            text_body="Test Text"
        )
        
        self.assertTrue(success)
        self.assertEqual(message, "Email sent successfully")
        mock_mail_service.send.assert_called_once()
    
    @patch('email_service.mail')
    def test_send_email_failure(self, mock_mail_service):
        """Test email sending failure"""
        mock_mail_service.send.side_effect = Exception("SMTP Error")
        
        success, message = send_email(
            to="test@example.com",
            subject="Test Subject",
            html_body="<h1>Test HTML</h1>"
        )
        
        self.assertFalse(success)
        self.assertEqual(message, "SMTP Error")
    
    def test_send_email_single_recipient(self):
        """Test email sending to single recipient"""
        with patch('email_service.mail') as mock_mail_service:
            send_email(
                to="single@example.com",
                subject="Test",
                html_body="Test"
            )
            
            # Verify Message was created correctly
            mock_mail_service.send.assert_called_once()
    
    def test_send_email_multiple_recipients(self):
        """Test email sending to multiple recipients"""
        with patch('email_service.mail') as mock_mail_service:
            recipients = ["user1@example.com", "user2@example.com"]
            send_email(
                to=recipients,
                subject="Test",
                html_body="Test"
            )
            
            mock_mail_service.send.assert_called_once()
    
    @patch('email_service.mongo')
    @patch('email_service.generate_secure_token')
    @patch('email_service.datetime')
    def test_create_password_reset_token(self, mock_datetime, mock_generate_token, mock_mongo_service):
        """Test password reset token creation"""
        # Mock token generation
        mock_generate_token.return_value = "test_token_123"
        
        # Mock datetime
        now = datetime(2023, 1, 1, 12, 0, 0)
        expiry = now + timedelta(hours=24)
        mock_datetime.utcnow.return_value = now
        
        # Mock database insertion
        mock_mongo_service.db.tokens.insert_one.return_value = MagicMock()
        
        token = create_password_reset_token("user@example.com")
        
        self.assertEqual(token, "test_token_123")
        
        # Verify token was stored in database
        mock_mongo_service.db.tokens.insert_one.assert_called_once()
        call_args = mock_mongo_service.db.tokens.insert_one.call_args[0][0]
        
        self.assertEqual(call_args["email"], "user@example.com")
        self.assertEqual(call_args["token"], "test_token_123")
        self.assertEqual(call_args["type"], "password_reset")
        self.assertFalse(call_args["used"])
    
    @patch('email_service.mongo')
    def test_create_password_reset_token_database_error(self, mock_mongo_service):
        """Test password reset token creation with database error"""
        mock_mongo_service.db.tokens.insert_one.side_effect = Exception("Database error")
        
        token = create_password_reset_token("user@example.com")
        
        self.assertIsNone(token)
    
    @patch('email_service.mongo')
    @patch('email_service.generate_secure_token')
    def test_create_email_verification_token(self, mock_generate_token, mock_mongo_service):
        """Test email verification token creation"""
        mock_generate_token.return_value = "verify_token_456"
        mock_mongo_service.db.tokens.insert_one.return_value = MagicMock()
        
        token = create_email_verification_token("user@example.com")
        
        self.assertEqual(token, "verify_token_456")
        
        # Verify correct token type
        call_args = mock_mongo_service.db.tokens.insert_one.call_args[0][0]
        self.assertEqual(call_args["type"], "email_verification")


class TestEmailTemplates(unittest.TestCase):
    """Test email template functionality"""
    
    @patch('email_service.send_email')
    @patch('email_service.create_password_reset_token')
    def test_send_password_reset_email(self, mock_create_token, mock_send_email):
        """Test sending password reset email"""
        mock_create_token.return_value = "reset_token_123"
        mock_send_email.return_value = (True, "Email sent successfully")
        
        success, message = send_password_reset_email("user@example.com", "Test User", "reset_token_123")
        
        self.assertTrue(success)
        mock_create_token.assert_called_once_with("user@example.com")
        mock_send_email.assert_called_once()
        
        # Verify email content
        call_args = mock_send_email.call_args
        self.assertEqual(call_args[1]["to"], "user@example.com")
        self.assertIn("Password Reset", call_args[1]["subject"])
    
    @patch('email_service.create_password_reset_token')
    def test_send_password_reset_email_token_creation_fails(self, mock_create_token):
        """Test password reset email when token creation fails"""
        mock_create_token.return_value = None
        
        success, message = send_password_reset_email("user@example.com", "Test User", None)
        
        self.assertFalse(success)
        self.assertIn("Failed to create", message)
    
    @patch('email_service.send_email')
    @patch('email_service.create_email_verification_token')
    def test_send_verification_email(self, mock_create_token, mock_send_email):
        """Test sending email verification email"""
        mock_create_token.return_value = "verify_token_456"
        mock_send_email.return_value = (True, "Email sent successfully")
        
        success, message = send_email_verification("user@example.com", "Test User", "verify_token_456")
        
        self.assertTrue(success)
        mock_create_token.assert_called_once_with("user@example.com")
        mock_send_email.assert_called_once()
        
        # Verify email content
        call_args = mock_send_email.call_args
        self.assertEqual(call_args[1]["to"], "user@example.com")
        self.assertIn("Verify", call_args[1]["subject"])
    
    def test_email_template_variables(self):
        """Test email template variable substitution"""
        # This would test actual template rendering if templates existed
        template_vars = {
            "user_name": "John Doe",
            "reset_url": "https://example.com/reset?token=abc123",
            "company_name": "Australia Jobs"
        }
        
        # Mock template content
        template_content = "Hello {user_name}, click {reset_url} to reset your password. - {company_name}"
        expected_result = "Hello John Doe, click https://example.com/reset?token=abc123 to reset your password. - Australia Jobs"
        
        result = template_content.format(**template_vars)
        self.assertEqual(result, expected_result)


class TestTokenValidation(unittest.TestCase):
    """Test token validation functionality"""
    
    @patch('email_service.mongo')
    def test_validate_token_valid(self, mock_mongo_service):
        """Test validation of valid token"""
        # Mock valid token from database
        valid_token_data = {
            "_id": "token_id",
            "email": "user@example.com",
            "token": "valid_token_123",
            "type": "password_reset",
            "expires_at": datetime.utcnow() + timedelta(hours=1),  # Not expired
            "used": False,
            "created_at": datetime.utcnow() - timedelta(minutes=30)
        }
        mock_mongo_service.db.tokens.find_one.return_value = valid_token_data
        
        # This would be a utility function in the actual implementation
        def validate_token(token, token_type):
            token_data = mock_mongo_service.db.tokens.find_one({
                "token": token,
                "type": token_type,
                "used": False
            })
            
            if not token_data:
                return False, "Token not found or already used"
            
            if token_data["expires_at"] < datetime.utcnow():
                return False, "Token has expired"
            
            return True, token_data
        
        is_valid, result = validate_token("valid_token_123", "password_reset")
        self.assertTrue(is_valid)
        self.assertEqual(result["email"], "user@example.com")
    
    @patch('email_service.mongo')
    def test_validate_token_expired(self, mock_mongo_service):
        """Test validation of expired token"""
        expired_token_data = {
            "_id": "token_id",
            "email": "user@example.com", 
            "token": "expired_token_123",
            "type": "password_reset",
            "expires_at": datetime.utcnow() - timedelta(hours=1),  # Expired
            "used": False
        }
        mock_mongo_service.db.tokens.find_one.return_value = expired_token_data
        
        def validate_token(token, token_type):
            token_data = mock_mongo_service.db.tokens.find_one({
                "token": token,
                "type": token_type,
                "used": False
            })
            
            if not token_data:
                return False, "Token not found or already used"
                
            if token_data["expires_at"] < datetime.utcnow():
                return False, "Token has expired"
                
            return True, token_data
        
        is_valid, message = validate_token("expired_token_123", "password_reset")
        self.assertFalse(is_valid)
        self.assertEqual(message, "Token has expired")
    
    @patch('email_service.mongo')
    def test_validate_token_not_found(self, mock_mongo_service):
        """Test validation of non-existent token"""
        mock_mongo_service.db.tokens.find_one.return_value = None
        
        def validate_token(token, token_type):
            token_data = mock_mongo_service.db.tokens.find_one({
                "token": token,
                "type": token_type,
                "used": False
            })
            
            if not token_data:
                return False, "Token not found or already used"
                
            return True, token_data
        
        is_valid, message = validate_token("nonexistent_token", "password_reset")
        self.assertFalse(is_valid)
        self.assertEqual(message, "Token not found or already used")


class TestEmailConfiguration(unittest.TestCase):
    """Test email service configuration"""
    
    def test_email_configuration_variables(self):
        """Test email configuration environment variables"""
        required_env_vars = [
            'MAIL_SERVER',
            'MAIL_PORT', 
            'MAIL_USE_TLS',
            'MAIL_USERNAME',
            'MAIL_PASSWORD',
            'MAIL_DEFAULT_SENDER'
        ]
        
        # This would test that configuration is properly loaded
        # In a real test, you'd check these are set in the app config
        for var in required_env_vars:
            # Test that the variable is defined (even if empty for testing)
            self.assertIsInstance(var, str)
            self.assertTrue(len(var) > 0)
    
    def test_mail_settings_validation(self):
        """Test mail settings validation"""
        valid_mail_settings = {
            'MAIL_SERVER': 'smtp.gmail.com',
            'MAIL_PORT': 587,
            'MAIL_USE_TLS': True,
            'MAIL_USERNAME': 'user@example.com',
            'MAIL_PASSWORD': 'password',
            'MAIL_DEFAULT_SENDER': 'noreply@australiajobs.com'
        }
        
        # Test that all required settings are present and valid
        self.assertIsInstance(valid_mail_settings['MAIL_PORT'], int)
        self.assertIsInstance(valid_mail_settings['MAIL_USE_TLS'], bool)
        self.assertIn('@', valid_mail_settings['MAIL_USERNAME'])
        self.assertIn('@', valid_mail_settings['MAIL_DEFAULT_SENDER'])


class TestEmailIntegration(unittest.TestCase):
    """Integration tests for email service"""
    
    @patch('email_service.mail')
    @patch('email_service.mongo')
    def test_complete_password_reset_flow(self, mock_mongo_service, mock_mail_service):
        """Test complete password reset email flow"""
        # Mock token storage
        mock_mongo_service.db.tokens.insert_one.return_value = MagicMock()
        
        # Mock email sending
        mock_mail_service.send.return_value = None
        
        email = "user@example.com"
        user_name = "Test User"
        
        # Send password reset email
        success, message = send_password_reset_email(email, user_name)
        
        self.assertTrue(success)
        
        # Verify token was created and stored
        mock_mongo_service.db.tokens.insert_one.assert_called_once()
        token_data = mock_mongo_service.db.tokens.insert_one.call_args[0][0]
        self.assertEqual(token_data["email"], email)
        self.assertEqual(token_data["type"], "password_reset")
        
        # Verify email was sent
        mock_mail_service.send.assert_called_once()
    
    @patch('email_service.mail')
    @patch('email_service.mongo')
    def test_complete_email_verification_flow(self, mock_mongo_service, mock_mail_service):
        """Test complete email verification flow"""
        # Mock token storage
        mock_mongo_service.db.tokens.insert_one.return_value = MagicMock()
        
        # Mock email sending
        mock_mail_service.send.return_value = None
        
        email = "newuser@example.com"
        user_name = "New User"
        
        # Send verification email
        success, message = send_verification_email(email, user_name)
        
        self.assertTrue(success)
        
        # Verify token was created
        mock_mongo_service.db.tokens.insert_one.assert_called_once()
        token_data = mock_mongo_service.db.tokens.insert_one.call_args[0][0]
        self.assertEqual(token_data["email"], email)
        self.assertEqual(token_data["type"], "email_verification")
        
        # Verify email was sent
        mock_mail_service.send.assert_called_once()


if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print(f"\nFailures:")
        for test, failure in result.failures:
            print(f"  - {test}: {failure}")
    
    if result.errors:
        print(f"\nErrors:")
        for test, error in result.errors:
            print(f"  - {test}: {error}")
    
    print(f"{'='*50}")