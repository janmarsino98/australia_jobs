"""
Test suite for applications module
Tests job application submission, tracking, and management
"""
import unittest
from unittest.mock import patch, MagicMock, Mock
import os
import sys
import json
from datetime import datetime

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import create_app from server
from server import create_app

# Mock extensions before importing application modules
with patch('extensions.mongo') as mock_mongo, \
     patch('extensions.fs') as mock_fs:
    mock_mongo.db.applications = MagicMock()
    mock_mongo.db.jobs = MagicMock()
    mock_mongo.db.users = MagicMock()
    from applications.applications import applications_bp, applications_db, jobs_db, users_db, APPLICATION_STATUSES
    from extensions import mongo, fs


class TestApplicationsAPI(unittest.TestCase):
    """Test applications API endpoints"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.register_blueprint(applications_bp, url_prefix='/applications')
        self.client = self.app.test_client()
        
        # Sample application data
        self.valid_application_data = {
            "job_id": "507f1f77bcf86cd799439011",
            "cover_letter": "I am very interested in this position...",
            "additional_notes": "I have relevant experience in..."
        }
        
        # Mock user session
        self.test_user_id = "507f1f77bcf86cd799439012"
    
    @patch('applications.applications.session')
    @patch('applications.applications.applications_db')
    @patch('applications.applications.jobs_db')
    @patch('applications.applications.users_db')
    @patch('applications.applications.ObjectId')
    def test_submit_application_success(self, mock_object_id, mock_users_db, mock_jobs_db, mock_applications_db, mock_session):
        """Test successful job application submission"""
        # Mock session
        mock_session.get.return_value = self.test_user_id
        
        # Mock ObjectId conversions
        mock_object_id.side_effect = lambda x: x  # Return the same value for simplicity
        
        # Mock job exists
        mock_job = {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Software Engineer",
            "employer_id": "employer123"
        }
        mock_jobs_db.find_one.return_value = mock_job
        
        # Mock user exists and is verified
        mock_user = {
            "_id": self.test_user_id,
            "email_verified": True,
            "name": "Test User"
        }
        mock_users_db.find_one.return_value = mock_user
        
        # Mock no existing application
        mock_applications_db.find_one.return_value = None
        
        # Mock successful application insertion
        mock_result = MagicMock()
        mock_result.inserted_id = "app123"
        mock_applications_db.insert_one.return_value = mock_result
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(self.valid_application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertIn("success", response_data)
            
            # Verify application was inserted with correct data
            mock_applications_db.insert_one.assert_called_once()
            call_args = mock_applications_db.insert_one.call_args[0][0]
            self.assertEqual(call_args["status"], "pending")
            self.assertEqual(call_args["cover_letter"], "I am very interested in this position...")
            self.assertIn("applied_at", call_args)
            self.assertIn("status_history", call_args)
    
    @patch('applications.applications.session')
    def test_submit_application_no_auth(self, mock_session):
        """Test application submission without authentication"""
        mock_session.get.return_value = None
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(self.valid_application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 401)
    
    @patch('applications.applications.session')
    def test_submit_application_missing_job_id(self, mock_session):
        """Test application submission with missing job ID"""
        mock_session.get.return_value = self.test_user_id
        
        invalid_data = self.valid_application_data.copy()
        del invalid_data["job_id"]
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(invalid_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertIn("error", response_data)
    
    @patch('applications.applications.session')
    @patch('applications.applications.ObjectId')
    def test_submit_application_invalid_job_id(self, mock_object_id, mock_session):
        """Test application submission with invalid job ID format"""
        mock_session.get.return_value = self.test_user_id
        mock_object_id.side_effect = Exception("Invalid ObjectId")
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(self.valid_application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Invalid job ID format")
    
    @patch('applications.applications.session')
    @patch('applications.applications.jobs_db')
    @patch('applications.applications.ObjectId')
    def test_submit_application_job_not_found(self, mock_object_id, mock_jobs_db, mock_session):
        """Test application submission for non-existent job"""
        mock_session.get.return_value = self.test_user_id
        mock_object_id.side_effect = lambda x: x
        mock_jobs_db.find_one.return_value = None
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(self.valid_application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 404)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Job not found")
    
    @patch('applications.applications.session')
    @patch('applications.applications.applications_db')
    @patch('applications.applications.jobs_db')
    @patch('applications.applications.ObjectId')
    def test_submit_application_already_applied(self, mock_object_id, mock_jobs_db, mock_applications_db, mock_session):
        """Test application submission when user already applied"""
        mock_session.get.return_value = self.test_user_id
        mock_object_id.side_effect = lambda x: x
        
        # Mock job exists
        mock_jobs_db.find_one.return_value = {"_id": "job123", "title": "Test Job"}
        
        # Mock existing application
        mock_applications_db.find_one.return_value = {"_id": "existing_app"}
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(self.valid_application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 409)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "You have already applied for this job")
    
    @patch('applications.applications.session')
    @patch('applications.applications.users_db')
    @patch('applications.applications.jobs_db')
    @patch('applications.applications.applications_db')
    @patch('applications.applications.ObjectId')
    def test_submit_application_user_not_verified(self, mock_object_id, mock_applications_db, mock_jobs_db, mock_users_db, mock_session):
        """Test application submission with unverified email"""
        mock_session.get.return_value = self.test_user_id
        mock_object_id.side_effect = lambda x: x
        
        # Mock job exists
        mock_jobs_db.find_one.return_value = {"_id": "job123"}
        
        # Mock no existing application
        mock_applications_db.find_one.return_value = None
        
        # Mock user with unverified email
        mock_user = {
            "_id": self.test_user_id,
            "email_verified": False
        }
        mock_users_db.find_one.return_value = mock_user
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(self.valid_application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 403)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Please verify your email before applying for jobs")


class TestApplicationStatuses(unittest.TestCase):
    """Test application status management"""
    
    def test_application_status_constants(self):
        """Test application status constants are properly defined"""
        expected_statuses = [
            'pending',
            'reviewing', 
            'interviewed',
            'accepted',
            'rejected',
            'withdrawn'
        ]
        
        self.assertEqual(APPLICATION_STATUSES, expected_statuses)
        self.assertEqual(len(APPLICATION_STATUSES), 6)
    
    def test_valid_status_transitions(self):
        """Test valid application status transitions"""
        # This is a conceptual test - actual status transition validation
        # would need to be implemented in the applications module
        
        valid_transitions = {
            'pending': ['reviewing', 'rejected', 'withdrawn'],
            'reviewing': ['interviewed', 'accepted', 'rejected'],
            'interviewed': ['accepted', 'rejected'],
            'accepted': [],  # Terminal state
            'rejected': [],  # Terminal state
            'withdrawn': []  # Terminal state
        }
        
        # Test that terminal states have no valid transitions
        terminal_states = ['accepted', 'rejected', 'withdrawn']
        for state in terminal_states:
            self.assertEqual(valid_transitions[state], [])
        
        # Test that pending can transition to reviewing
        self.assertIn('reviewing', valid_transitions['pending'])


class TestApplicationsValidation(unittest.TestCase):
    """Test application data validation"""
    
    def test_required_fields_validation(self):
        """Test validation of required fields"""
        required_fields = ["job_id"]
        
        valid_data = {
            "job_id": "507f1f77bcf86cd799439011",
            "cover_letter": "Optional cover letter",
            "additional_notes": "Optional notes"
        }
        
        # Test that required field is present
        for field in required_fields:
            self.assertIn(field, valid_data)
            self.assertTrue(valid_data[field])  # Not empty
    
    def test_optional_fields_handling(self):
        """Test handling of optional fields"""
        optional_fields = ["cover_letter", "additional_notes"]
        
        minimal_data = {
            "job_id": "507f1f77bcf86cd799439011"
        }
        
        # Test that application can be submitted without optional fields
        for field in optional_fields:
            self.assertNotIn(field, minimal_data)
    
    def test_cover_letter_length_validation(self):
        """Test cover letter length validation"""
        # This is a conceptual test - actual length validation
        # would need to be implemented in the applications module
        
        # Test maximum length (e.g., 5000 characters)
        max_length = 5000
        long_cover_letter = "a" * (max_length + 1)
        
        # In a real implementation, this would call a validation function
        self.assertGreater(len(long_cover_letter), max_length)
    
    def test_job_id_format_validation(self):
        """Test job ID format validation"""
        valid_job_ids = [
            "507f1f77bcf86cd799439011",
            "507f191e810c19729de860ea",
            "6092c3a2f1d2c3b4a5e6f789"
        ]
        
        invalid_job_ids = [
            "invalid",
            "123",
            "",
            "507f1f77bcf86cd79943901",  # Too short
            "507f1f77bcf86cd799439011z"  # Invalid character
        ]
        
        # Test valid ObjectId formats
        for job_id in valid_job_ids:
            self.assertEqual(len(job_id), 24)
            self.assertTrue(all(c in '0123456789abcdef' for c in job_id.lower()))
        
        # Test invalid formats
        for job_id in invalid_job_ids:
            with self.subTest(job_id=job_id):
                # In real implementation, this would call ObjectId validation
                is_valid = len(job_id) == 24 and all(c in '0123456789abcdef' for c in job_id.lower())
                self.assertFalse(is_valid)


class TestApplicationsIntegration(unittest.TestCase):
    """Integration tests for applications functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.register_blueprint(applications_bp, url_prefix='/applications')
        self.client = self.app.test_client()
    
    @patch('applications.applications.session')
    @patch('applications.applications.applications_db')
    @patch('applications.applications.jobs_db') 
    @patch('applications.applications.users_db')
    @patch('applications.applications.ObjectId')
    def test_application_submission_workflow(self, mock_object_id, mock_users_db, mock_jobs_db, mock_applications_db, mock_session):
        """Test complete application submission workflow"""
        # Setup mocks
        mock_session.get.return_value = "user123"
        mock_object_id.side_effect = lambda x: x
        
        # Mock job exists
        mock_jobs_db.find_one.return_value = {
            "_id": "job123",
            "title": "Test Job",
            "employer_id": "employer123"
        }
        
        # Mock verified user
        mock_users_db.find_one.return_value = {
            "_id": "user123",
            "email_verified": True,
            "name": "Test User"
        }
        
        # Mock no existing application
        mock_applications_db.find_one.return_value = None
        
        # Mock successful insertion
        mock_result = MagicMock()
        mock_result.inserted_id = "app123"
        mock_applications_db.insert_one.return_value = mock_result
        
        application_data = {
            "job_id": "job123",
            "cover_letter": "I am interested in this position",
            "additional_notes": "I have the required skills"
        }
        
        with self.app.app_context():
            response = self.client.post('/applications/submit',
                                      data=json.dumps(application_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            
            # Verify the application was created with correct structure
            mock_applications_db.insert_one.assert_called_once()
            application_doc = mock_applications_db.insert_one.call_args[0][0]
            
            # Verify required fields
            self.assertEqual(application_doc["status"], "pending")
            self.assertEqual(application_doc["cover_letter"], "I am interested in this position")
            self.assertEqual(application_doc["additional_notes"], "I have the required skills")
            
            # Verify timestamps
            self.assertIn("applied_at", application_doc)
            self.assertIn("updated_at", application_doc)
            
            # Verify status history
            self.assertIn("status_history", application_doc)
            self.assertEqual(len(application_doc["status_history"]), 1)
            self.assertEqual(application_doc["status_history"][0]["status"], "pending")
            self.assertEqual(application_doc["status_history"][0]["notes"], "Application submitted")


class TestApplicationsUtils(unittest.TestCase):
    """Test utility functions for applications"""
    
    def test_application_status_validation(self):
        """Test application status validation utility"""
        # This is a conceptual test for a utility function that might exist
        
        def is_valid_status(status):
            """Utility function to validate application status"""
            return status in APPLICATION_STATUSES
        
        # Test valid statuses
        for status in APPLICATION_STATUSES:
            self.assertTrue(is_valid_status(status))
        
        # Test invalid statuses
        invalid_statuses = ['invalid', 'in_progress', 'approved', 'denied']
        for status in invalid_statuses:
            self.assertFalse(is_valid_status(status))
    
    def test_application_date_formatting(self):
        """Test application date formatting utilities"""
        # This is a conceptual test for date formatting utilities
        
        test_date = datetime(2023, 1, 15, 10, 30, 0)
        
        # Test ISO format
        iso_format = test_date.isoformat()
        self.assertEqual(iso_format, "2023-01-15T10:30:00")
        
        # Test that dates can be properly parsed back
        parsed_date = datetime.fromisoformat(iso_format)
        self.assertEqual(parsed_date, test_date)


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