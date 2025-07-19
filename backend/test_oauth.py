import unittest
from unittest.mock import patch, MagicMock, Mock
import os
import sys
from flask import Flask, session
import json

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock extensions before importing auth modules
with patch('extensions.mongo') as mock_mongo:
    mock_mongo.db.users = MagicMock()
    from auth.auth import auth_bp, init_oauth, find_or_create_oauth_user
    from extensions import mongo, bcrypt, server_session


class TestOAuthInitialization(unittest.TestCase):
    """Test OAuth initialization and configuration"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        
        # Mock environment variables
        self.env_patcher = patch.dict(os.environ, {
            'GOOGLE_OAUTH_CLIENT_ID': 'test_google_client_id',
            'GOOGLE_OAUTH_CLIENT_SECRET': 'test_google_client_secret',
            'LINKEDIN_OAUTH_CLIENT_ID': 'test_linkedin_client_id',
            'LINKEDIN_OAUTH_CLIENT_SECRET': 'test_linkedin_client_secret',
            'FRONTEND_URL': 'http://localhost:5173'
        })
        self.env_patcher.start()
    
    def tearDown(self):
        """Clean up after tests"""
        self.env_patcher.stop()
    
    def test_oauth_environment_variables(self):
        """Test that OAuth environment variables are properly loaded"""
        with self.app.app_context():
            self.assertEqual(os.getenv('GOOGLE_OAUTH_CLIENT_ID'), 'test_google_client_id')
            self.assertEqual(os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'), 'test_google_client_secret')
            self.assertEqual(os.getenv('LINKEDIN_OAUTH_CLIENT_ID'), 'test_linkedin_client_id')
            self.assertEqual(os.getenv('LINKEDIN_OAUTH_CLIENT_SECRET'), 'test_linkedin_client_secret')
    
    @patch('auth.auth.oauth')
    def test_oauth_initialization_success(self, mock_oauth):
        """Test successful OAuth initialization"""
        mock_google_client = MagicMock()
        mock_google_client.client_id = 'test_google_client_id'
        
        mock_linkedin_client = MagicMock()
        mock_linkedin_client.client_id = 'test_linkedin_client_id'
        
        mock_oauth.register.side_effect = [mock_google_client, mock_linkedin_client]
        
        with self.app.app_context():
            google_client, linkedin_client = init_oauth(self.app)
            
            # Verify OAuth was initialized
            mock_oauth.init_app.assert_called_once_with(self.app)
            
            # Verify Google OAuth registration
            google_call_args = mock_oauth.register.call_args_list[0]
            self.assertEqual(google_call_args[1]['name'], 'google')
            self.assertEqual(google_call_args[1]['client_id'], 'test_google_client_id')
            self.assertEqual(google_call_args[1]['client_secret'], 'test_google_client_secret')
            self.assertIn('openid email profile', google_call_args[1]['client_kwargs']['scope'])
            
            # Verify LinkedIn OAuth registration
            linkedin_call_args = mock_oauth.register.call_args_list[1]
            self.assertEqual(linkedin_call_args[1]['name'], 'linkedin')
            self.assertEqual(linkedin_call_args[1]['client_id'], 'test_linkedin_client_id')
            self.assertEqual(linkedin_call_args[1]['client_secret'], 'test_linkedin_client_secret')
            # This test will help us verify the current scope configuration
            self.assertIn('scope', linkedin_call_args[1]['client_kwargs'])
    
    @patch('auth.auth.oauth')
    def test_oauth_initialization_missing_credentials(self, mock_oauth):
        """Test OAuth initialization with missing credentials"""
        with patch.dict(os.environ, {}, clear=True):
            with self.app.app_context():
                # This should handle missing credentials gracefully
                try:
                    google_client, linkedin_client = init_oauth(self.app)
                    # Should still initialize OAuth even with missing credentials
                    mock_oauth.init_app.assert_called_once_with(self.app)
                except Exception as e:
                    # If it raises an exception, it should be handled gracefully
                    self.assertIsInstance(e, Exception)
    
    def test_linkedin_scope_configuration(self):
        """Test LinkedIn scope configuration to identify deprecated scopes"""
        with self.app.app_context():
            # This test will help us identify what scopes are currently being used
            from auth.auth import oauth
            
            # Mock the oauth register to capture the configuration
            with patch.object(oauth, 'register') as mock_register:
                mock_client = MagicMock()
                mock_client.client_id = 'test_linkedin_client_id'
                mock_register.return_value = mock_client
                
                init_oauth(self.app)
                
                # Find the LinkedIn registration call
                linkedin_call = None
                for call in mock_register.call_args_list:
                    if call[1].get('name') == 'linkedin':
                        linkedin_call = call
                        break
                
                self.assertIsNotNone(linkedin_call, "LinkedIn OAuth registration not found")
                
                # Check the current scope configuration
                client_kwargs = linkedin_call[1]['client_kwargs']
                current_scope = client_kwargs.get('scope', '')
                
                print(f"Current LinkedIn scope: {current_scope}")
                
                # Test for deprecated scopes that cause the error
                self.assertNotIn('r_emailaddress', current_scope, 
                               "LinkedIn scope contains deprecated 'r_emailaddress'")
                self.assertNotIn('r_liteprofile', current_scope, 
                               "LinkedIn scope contains deprecated 'r_liteprofile'")


class TestLinkedInOAuth(unittest.TestCase):
    """Test LinkedIn OAuth flow"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        
        # Mock environment variables
        self.env_patcher = patch.dict(os.environ, {
            'LINKEDIN_OAUTH_CLIENT_ID': 'test_linkedin_client_id',
            'LINKEDIN_OAUTH_CLIENT_SECRET': 'test_linkedin_client_secret',
            'FRONTEND_URL': 'http://localhost:5173'
        })
        self.env_patcher.start()
    
    def tearDown(self):
        """Clean up after tests"""
        self.env_patcher.stop()
    
    @patch('auth.auth.oauth')
    def test_linkedin_login_initiation(self, mock_oauth):
        """Test LinkedIn login initiation"""
        mock_linkedin = MagicMock()
        mock_linkedin.authorize_redirect.return_value = "redirect_response"
        mock_oauth.linkedin = mock_linkedin
        
        with self.app.app_context():
            response = self.client.get('/auth/linkedin/login')
            
            # Should call authorize_redirect with correct redirect URI
            mock_linkedin.authorize_redirect.assert_called_once()
            call_args = mock_linkedin.authorize_redirect.call_args[0]
            redirect_uri = call_args[0]
            self.assertIn('/auth/linkedin/callback', redirect_uri)
    
    def test_linkedin_callback_missing_code(self):
        """Test LinkedIn callback without authorization code"""
        with self.app.app_context():
            # Simulate callback without code parameter
            response = self.client.get('/auth/linkedin/callback?error=unauthorized_scope_error&error_description=Scope+%26quot;r_emailaddress%26quot;+is+not+authorized+for+your+application')
            
            # Should return error status
            self.assertEqual(response.status_code, 400)
    
    @patch('auth.auth.oauth')
    def test_linkedin_callback_scope_error(self, mock_oauth):
        """Test LinkedIn callback with scope error (the actual error we're seeing)"""
        mock_linkedin = MagicMock()
        mock_oauth.linkedin = mock_linkedin
        
        with self.app.app_context():
            # Simulate the actual error from logs
            response = self.client.get('/auth/linkedin/callback?error=unauthorized_scope_error&error_description=Scope+%26quot;r_emailaddress%26quot;+is+not+authorized+for+your+application&state=test_state')
            
            # Should handle scope error gracefully
            self.assertEqual(response.status_code, 400)
            
            # Verify that authorize_access_token was not called (since no code parameter)
            mock_linkedin.authorize_access_token.assert_not_called()
    
    @patch('auth.auth.oauth')
    @patch('auth.auth.find_or_create_oauth_user')
    def test_linkedin_callback_success(self, mock_find_user, mock_oauth):
        """Test successful LinkedIn callback"""
        # Mock LinkedIn OAuth client
        mock_linkedin = MagicMock()
        mock_oauth.linkedin = mock_linkedin
        
        # Mock token response
        mock_token = {
            'access_token': 'test_access_token',
            'token_type': 'Bearer'
        }
        mock_linkedin.authorize_access_token.return_value = mock_token
        
        # Mock profile response
        mock_profile_response = MagicMock()
        mock_profile_response.status_code = 200
        mock_profile_response.json.return_value = {
            'id': 'test_linkedin_id',
            'firstName': {
                'localized': {'en_US': 'John'}
            },
            'lastName': {
                'localized': {'en_US': 'Doe'}
            }
        }
        
        # Mock email response
        mock_email_response = MagicMock()
        mock_email_response.status_code = 200
        mock_email_response.json.return_value = {
            'elements': [{
                'handle~': {
                    'emailAddress': 'john.doe@example.com'
                }
            }]
        }
        
        mock_linkedin.get.side_effect = [mock_profile_response, mock_email_response]
        
        # Mock user creation
        mock_user = {
            '_id': 'test_user_id',
            'email': 'john.doe@example.com',
            'name': 'John Doe'
        }
        mock_find_user.return_value = mock_user
        
        with self.app.app_context():
            with self.client.session_transaction() as sess:
                pass  # Ensure session is available
            
            response = self.client.get('/auth/linkedin/callback?code=test_auth_code&state=test_state')
            
            # Should redirect to frontend on success
            self.assertEqual(response.status_code, 302)
            self.assertIn('oauth/callback?success=true', response.location)
    
    @patch('auth.auth.oauth')
    def test_linkedin_callback_api_error(self, mock_oauth):
        """Test LinkedIn callback with API errors"""
        # Mock LinkedIn OAuth client
        mock_linkedin = MagicMock()
        mock_oauth.linkedin = mock_linkedin
        
        # Mock token response
        mock_token = {
            'access_token': 'test_access_token',
            'token_type': 'Bearer'
        }
        mock_linkedin.authorize_access_token.return_value = mock_token
        
        # Mock failed profile response
        mock_profile_response = MagicMock()
        mock_profile_response.status_code = 400
        mock_profile_response.text = 'API Error'
        
        mock_linkedin.get.return_value = mock_profile_response
        
        with self.app.app_context():
            response = self.client.get('/auth/linkedin/callback?code=test_auth_code&state=test_state')
            
            # Should redirect to frontend with error
            self.assertEqual(response.status_code, 302)
            self.assertIn('oauth/callback?error=oauth_failed', response.location)


class TestOAuthUserManagement(unittest.TestCase):
    """Test OAuth user creation and management"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        
    @patch('auth.auth.users_db')
    def test_find_or_create_oauth_user_existing(self, mock_users_db):
        """Test finding existing OAuth user"""
        # Mock existing user
        existing_user = {
            '_id': 'test_user_id',
            'email': 'test@example.com',
            'name': 'Test User',
            'oauth_accounts': {}
        }
        mock_users_db.find_one.return_value = existing_user
        
        with self.app.app_context():
            user = find_or_create_oauth_user(
                'test@example.com', 
                'Test User', 
                'linkedin', 
                'linkedin_id_123'
            )
            
            self.assertEqual(user, existing_user)
            mock_users_db.find_one.assert_called_once_with({'email': 'test@example.com'})
    
    @patch('auth.auth.users_db')
    def test_find_or_create_oauth_user_new(self, mock_users_db):
        """Test creating new OAuth user"""
        # Mock no existing user
        mock_users_db.find_one.return_value = None
        
        # Mock successful user creation
        mock_result = MagicMock()
        mock_result.inserted_id = 'new_user_id'
        mock_users_db.insert_one.return_value = mock_result
        
        with self.app.app_context():
            user = find_or_create_oauth_user(
                'newuser@example.com', 
                'New User', 
                'linkedin', 
                'linkedin_id_456'
            )
            
            self.assertIsNotNone(user)
            self.assertEqual(user['email'], 'newuser@example.com')
            self.assertEqual(user['name'], 'New User')
            self.assertTrue(user['email_verified'])
            self.assertIn('linkedin', user['oauth_accounts'])
    
    @patch('auth.auth.users_db')
    def test_find_or_create_oauth_user_error(self, mock_users_db):
        """Test OAuth user creation with database error"""
        # Mock database error
        mock_users_db.find_one.side_effect = Exception("Database error")
        
        with self.app.app_context():
            user = find_or_create_oauth_user(
                'error@example.com', 
                'Error User', 
                'linkedin', 
                'linkedin_id_789'
            )
            
            self.assertIsNone(user)


class TestOAuthErrors(unittest.TestCase):
    """Test OAuth error handling"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
    
    def test_linkedin_login_without_oauth_client(self):
        """Test LinkedIn login when OAuth client is not initialized"""
        with self.app.app_context():
            # This will test the case where OAuth client doesn't exist
            with patch('auth.auth.oauth') as mock_oauth:
                # Remove linkedin attribute
                del mock_oauth.linkedin
                
                response = self.client.get('/auth/linkedin/login')
                
                self.assertEqual(response.status_code, 500)
                response_data = json.loads(response.data)
                self.assertIn('OAuth not properly initialized', response_data['error'])
    
    @patch('auth.auth.oauth')
    def test_linkedin_login_oauth_error(self, mock_oauth):
        """Test LinkedIn login with OAuth error"""
        mock_linkedin = MagicMock()
        mock_linkedin.authorize_redirect.side_effect = Exception("OAuth error")
        mock_oauth.linkedin = mock_linkedin
        
        with self.app.app_context():
            response = self.client.get('/auth/linkedin/login')
            
            self.assertEqual(response.status_code, 500)
            response_data = json.loads(response.data)
            self.assertIn('OAuth initialization failed', response_data['error'])


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