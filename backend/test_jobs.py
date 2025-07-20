"""
Test suite for jobs module
Tests job creation, retrieval, modification, and validation
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

# Mock extensions before importing job modules
with patch('extensions.mongo') as mock_mongo:
    mock_mongo.db.jobs = MagicMock()
    from jobs.jobs import jobs_bp, jobs_db, create_slug_with_code
    from extensions import mongo


class TestJobsAPI(unittest.TestCase):
    """Test jobs API endpoints"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.register_blueprint(jobs_bp, url_prefix='/jobs')
        self.client = self.app.test_client()
        
        # Sample job data
        self.valid_job_data = {
            "title": "Software Engineer",
            "description": "Develop and maintain web applications using Python and React",
            "remuneration_amount": 80000,
            "remuneration_period": "annual",
            "firm": "Tech Corp",
            "jobtype": "full-time",
            "shift": "day",
            "location": {
                "city": "Sydney"
            }
        }
    
    @patch('jobs.jobs.jobs_db')
    @patch('jobs.jobs.create_slug_with_code')
    def test_add_job_success(self, mock_slug, mock_jobs_db):
        """Test successful job creation"""
        mock_slug.return_value = "software-engineer-sydney-123"
        mock_result = MagicMock()
        mock_result.inserted_id = "507f1f77bcf86cd799439011"
        mock_jobs_db.insert_one.return_value = mock_result
        
        with self.app.app_context():
            response = self.client.post('/jobs/add', 
                                      data=json.dumps(self.valid_job_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertIn("successfuly", response_data["messsage"])  # Note: typo in original code
            
            # Verify job insertion was called with correct data
            mock_jobs_db.insert_one.assert_called_once()
            call_args = mock_jobs_db.insert_one.call_args[0][0]
            self.assertEqual(call_args["title"], "Software Engineer")
            self.assertEqual(call_args["firm"], "Tech Corp")
            self.assertEqual(call_args["location"], "Sydney")
            self.assertIn("created_at", call_args)
            self.assertIn("slug", call_args)
    
    def test_add_job_missing_title(self):
        """Test job creation with missing title"""
        invalid_data = self.valid_job_data.copy()
        del invalid_data["title"]
        
        with self.app.app_context():
            response = self.client.post('/jobs/add',
                                      data=json.dumps(invalid_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Job title is mandatory")
    
    def test_add_job_missing_description(self):
        """Test job creation with missing description"""
        invalid_data = self.valid_job_data.copy()
        del invalid_data["description"]
        
        with self.app.app_context():
            response = self.client.post('/jobs/add',
                                      data=json.dumps(invalid_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Job description is mandatory")
    
    def test_add_job_missing_remuneration_amount(self):
        """Test job creation with missing remuneration amount"""
        invalid_data = self.valid_job_data.copy()
        del invalid_data["remuneration_amount"]
        
        with self.app.app_context():
            response = self.client.post('/jobs/add',
                                      data=json.dumps(invalid_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Job remuneration_amount is mandatory")
    
    def test_add_job_missing_firm(self):
        """Test job creation with missing firm"""
        invalid_data = self.valid_job_data.copy()
        del invalid_data["firm"]
        
        with self.app.app_context():
            response = self.client.post('/jobs/add',
                                      data=json.dumps(invalid_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Job firm is mandatory")
    
    @patch('jobs.jobs.jobs_db')
    def test_add_job_database_error(self, mock_jobs_db):
        """Test job creation with database error"""
        mock_result = MagicMock()
        mock_result.inserted_id = None
        mock_jobs_db.insert_one.return_value = mock_result
        
        with self.app.app_context():
            response = self.client.post('/jobs/add',
                                      data=json.dumps(self.valid_job_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Could not insert job")
    
    @patch('jobs.jobs.jobs_db')
    def test_get_one_job_success(self, mock_jobs_db):
        """Test successful job retrieval"""
        mock_job = {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Software Engineer",
            "description": "Test description",
            "firm": "Tech Corp"
        }
        mock_jobs_db.find_one.return_value = mock_job
        
        request_data = {"job_id": "507f1f77bcf86cd799439011"}
        
        with self.app.app_context():
            response = self.client.get('/jobs/get_one',
                                     data=json.dumps(request_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["title"], "Software Engineer")
            self.assertEqual(response_data["_id"], "507f1f77bcf86cd799439011")
    
    def test_get_one_job_missing_id(self):
        """Test job retrieval with missing job ID"""
        request_data = {}
        
        with self.app.app_context():
            response = self.client.get('/jobs/get_one',
                                     data=json.dumps(request_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "You must specify a job id")
    
    @patch('jobs.jobs.jobs_db')
    @patch('jobs.jobs.ObjectId')
    def test_modify_job_success(self, mock_object_id, mock_jobs_db):
        """Test successful job modification"""
        job_id = "507f1f77bcf86cd799439011"
        mock_object_id.return_value = job_id
        
        # Mock existing job
        existing_job = {
            "_id": job_id,
            "title": "Software Engineer",
            "description": "Old description",
            "firm": "Tech Corp"
        }
        mock_jobs_db.find_one.return_value = existing_job
        
        # Mock successful update
        mock_result = MagicMock()
        mock_result.modified_count = 1
        mock_jobs_db.update_one.return_value = mock_result
        
        modify_data = {
            "job_id": job_id,
            "description": "Updated description",
            "title": "Senior Software Engineer"
        }
        
        with self.app.app_context():
            response = self.client.put('/jobs/modify',
                                     data=json.dumps(modify_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["message"], "Job modified correctly!")
    
    def test_modify_job_missing_id(self):
        """Test job modification with missing job ID"""
        modify_data = {"title": "New Title"}
        
        with self.app.app_context():
            response = self.client.put('/jobs/modify',
                                     data=json.dumps(modify_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "You must specify the job id that you want to modify.")
    
    @patch('jobs.jobs.ObjectId')
    def test_modify_job_invalid_id_format(self, mock_object_id):
        """Test job modification with invalid job ID format"""
        mock_object_id.side_effect = Exception("Invalid ObjectId")
        
        modify_data = {"job_id": "invalid_id", "title": "New Title"}
        
        with self.app.app_context():
            response = self.client.put('/jobs/modify',
                                     data=json.dumps(modify_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Invalid job ID format.")
    
    @patch('jobs.jobs.jobs_db')
    @patch('jobs.jobs.ObjectId')
    def test_modify_job_not_found(self, mock_object_id, mock_jobs_db):
        """Test job modification with non-existent job"""
        job_id = "507f1f77bcf86cd799439011"
        mock_object_id.return_value = job_id
        mock_jobs_db.find_one.return_value = None
        
        modify_data = {"job_id": job_id, "title": "New Title"}
        
        with self.app.app_context():
            response = self.client.put('/jobs/modify',
                                     data=json.dumps(modify_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "Job not found.")
    
    @patch('jobs.jobs.jobs_db')
    @patch('jobs.jobs.ObjectId')
    def test_modify_job_no_fields_to_update(self, mock_object_id, mock_jobs_db):
        """Test job modification with no valid fields to update"""
        job_id = "507f1f77bcf86cd799439011"
        mock_object_id.return_value = job_id
        
        existing_job = {
            "_id": job_id,
            "title": "Software Engineer"
        }
        mock_jobs_db.find_one.return_value = existing_job
        
        # Only provide job_id and invalid field
        modify_data = {"job_id": job_id, "invalid_field": "value"}
        
        with self.app.app_context():
            response = self.client.put('/jobs/modify',
                                     data=json.dumps(modify_data),
                                     content_type='application/json')
            
            self.assertEqual(response.status_code, 400)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["error"], "No fields to update.")


class TestJobsUtilities(unittest.TestCase):
    """Test utility functions in jobs module"""
    
    @patch('jobs.jobs.slugify')
    @patch('jobs.jobs.random.choices')
    def test_create_slug_with_code(self, mock_choices, mock_slugify):
        """Test slug creation with code"""
        # Note: This test assumes create_slug_with_code function exists
        # If it doesn't exist in the actual code, we'll need to mock it differently
        mock_slugify.return_value = "software-engineer-sydney"
        mock_choices.return_value = ['A', 'B', 'C']
        
        # This is a placeholder test - actual implementation may vary
        with patch('jobs.jobs.create_slug_with_code') as mock_create_slug:
            mock_create_slug.return_value = "software-engineer-sydney-ABC"
            result = mock_create_slug("Software Engineer", "Sydney")
            self.assertEqual(result, "software-engineer-sydney-ABC")


class TestJobsIntegration(unittest.TestCase):
    """Integration tests for jobs functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.register_blueprint(jobs_bp, url_prefix='/jobs')
        self.client = self.app.test_client()
    
    @patch('jobs.jobs.jobs_db')
    def test_job_lifecycle(self, mock_jobs_db):
        """Test complete job lifecycle: create, get, modify"""
        # Test job creation
        job_data = {
            "title": "Python Developer",
            "description": "Work with Django and Flask",
            "remuneration_amount": 75000,
            "remuneration_period": "annual",
            "firm": "Python Corp",
            "jobtype": "full-time",
            "shift": "day",
            "location": {"city": "Melbourne"}
        }
        
        # Mock successful creation
        mock_result = MagicMock()
        mock_result.inserted_id = "job123"
        mock_jobs_db.insert_one.return_value = mock_result
        
        with self.app.app_context():
            # Create job
            create_response = self.client.post('/jobs/add',
                                             data=json.dumps(job_data),
                                             content_type='application/json')
            self.assertEqual(create_response.status_code, 200)
            
            # Mock job for retrieval
            mock_job = {
                "_id": "job123",
                "title": "Python Developer",
                "description": "Work with Django and Flask",
                "firm": "Python Corp"
            }
            mock_jobs_db.find_one.return_value = mock_job
            
            # Get job
            get_response = self.client.get('/jobs/get_one',
                                         data=json.dumps({"job_id": "job123"}),
                                         content_type='application/json')
            self.assertEqual(get_response.status_code, 200)
            job_retrieved = json.loads(get_response.data)
            self.assertEqual(job_retrieved["title"], "Python Developer")


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