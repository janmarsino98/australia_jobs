#!/usr/bin/env python3
"""
Test script for sample resume analysis using actual PDF files
Tests the /analyze-structured endpoint with sampleResume.pdf and sampleResumeNo.pdf
"""
import os
import sys
import requests
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://localhost:5000"
SAMPLE_RESUME_PATH = "../frontend/src/datasets/sampleResume.pdf"
SAMPLE_NON_RESUME_PATH = "../frontend/src/datasets/sampleResumeNo.pdf"

# API endpoints based on server.py blueprint registrations
AUTH_LOGIN_ENDPOINT = f"{BASE_URL}/auth/login"
AUTH_REGISTER_ENDPOINT = f"{BASE_URL}/auth/register"
RESUME_UPLOAD_ENDPOINT = f"{BASE_URL}/resume/upload"
RESUME_ANALYZE_ENDPOINT = f"{BASE_URL}/resume/analyze-structured"
RESUME_DELETE_ENDPOINT = f"{BASE_URL}/resume/current"

class TestSession:
    """Helper class to manage test session"""
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.resume_id = None
        
    def login_test_user(self):
        """Create/login test user for testing"""
        try:
            # Try to login with test credentials
            # Use timestamp-based email to avoid account lockout
            import time
            test_email = f"testuser{int(time.time())}@example.com"
            
            login_data = {
                "email": test_email,
                "password": "TestPass123!"
            }
            
            response = self.session.post(AUTH_LOGIN_ENDPOINT, json=login_data)
            
            if response.status_code == 200:
                print("Logged in with existing test user")
                return True
            elif response.status_code == 401:
                # User doesn't exist, try to register
                register_data = {
                    "name": "Test User",
                    "email": test_email,
                    "password": "TestPass123!",
                    "role": "job_seeker"
                }
                
                response = self.session.post(AUTH_REGISTER_ENDPOINT, json=register_data)
                
                if response.status_code == 201:
                    print("Created new test user")
                    # Now login
                    response = self.session.post(AUTH_LOGIN_ENDPOINT, json=login_data)
                    if response.status_code == 200:
                        print("Logged in with new test user")
                        return True
                    
            print(f"Failed to login test user: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            print(f"Error during login: {e}")
            return False
    
    def upload_resume(self, pdf_path):
        """Upload a resume file"""
        try:
            if not os.path.exists(pdf_path):
                print(f"PDF file not found: {pdf_path}")
                return False
                
            with open(pdf_path, 'rb') as pdf_file:
                files = {'file': ('test_resume.pdf', pdf_file, 'application/pdf')}
                response = self.session.post(RESUME_UPLOAD_ENDPOINT, files=files)
                
                if response.status_code == 200:
                    data = response.json()
                    self.resume_id = data.get('id')
                    print(f"Resume uploaded successfully (ID: {self.resume_id})")
                    return True
                else:
                    print(f"Resume upload failed: {response.status_code}")
                    print(f"Response: {response.text}")
                    return False
                    
        except Exception as e:
            print(f"Error uploading resume: {e}")
            return False
    
    def analyze_resume_structured(self):
        """Analyze resume using structured analysis"""
        try:
            print(f"Making request to: {RESUME_ANALYZE_ENDPOINT}")
            response = self.session.post(RESUME_ANALYZE_ENDPOINT)
            print(f"Received response with status: {response.status_code}")
            return response
            
        except Exception as e:
            print(f"Error analyzing resume: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def cleanup(self):
        """Clean up test data"""
        try:
            # Delete current resume if exists
            if self.resume_id:
                response = self.session.delete(RESUME_DELETE_ENDPOINT)
                if response.status_code == 200:
                    print("Test resume cleaned up")
                    
        except Exception as e:
            print(f"Error during cleanup: {e}")

def test_valid_resume_analysis():
    """Test analysis of a valid resume (sampleResume.pdf) - expects 200"""
    print("\n" + "="*60)
    print("Testing Valid Resume Analysis (sampleResume.pdf)")
    print("="*60)
    
    test_session = TestSession()
    
    try:
        # Login test user
        if not test_session.login_test_user():
            return False
        
        # Upload sample resume
        if not test_session.upload_resume(SAMPLE_RESUME_PATH):
            return False
        
        # Analyze resume
        response = test_session.analyze_resume_structured()
        
        if not response:
            return False
        
        print(f"Response Status: {response.status_code}")
        
        # Expect 200 status code for valid resume
        if response.status_code == 200:
            data = response.json()
            
            print("Valid resume analysis successful")
            print(f"   - Success: {data.get('success', False)}")
            print(f"   - Is Resume: {data.get('is_resume', False)}")
            print(f"   - Confidence: {data.get('confidence_score', 0):.2f}")
            print(f"   - Parsing Method: {data.get('parsing_method', 'unknown')}")
            
            # Check structured summary
            if 'structured_summary' in data:
                summary = data['structured_summary']
                print(f"\nStructured Summary:")
                print(f"   - Contact Info: {summary.get('contact_info', {}).get('full_name', 'Not found')}")
                print(f"   - Work Experience: {summary.get('work_experience_count', 0)} entries")
                print(f"   - Education: {summary.get('education_count', 0)} entries")
                print(f"   - Skills: {summary.get('skills_count', 0)} skills")
                print(f"   - Certifications: {summary.get('certifications_count', 0)} certifications")
                print(f"   - Total Experience: {summary.get('total_experience_years', 'Not calculated')} years")
            
            # Check completeness analysis
            if 'completeness_analysis' in data:
                completeness = data['completeness_analysis']
                score = completeness.get('completeness_score', 0)
                print(f"\nCompleteness Score: {score:.1f}%")
            
            return True
            
        else:
            print(f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        test_session.cleanup()

def test_non_resume_analysis():
    """Test analysis of a non-resume document (sampleResumeNo.pdf) - expects not a resume"""
    print("\n" + "="*60)
    print("Testing Non-Resume Document Analysis (sampleResumeNo.pdf)")
    print("="*60)
    
    test_session = TestSession()
    
    try:
        # Login test user
        if not test_session.login_test_user():
            return False
        
        # Upload sample non-resume
        if not test_session.upload_resume(SAMPLE_NON_RESUME_PATH):
            return False
        
        # Analyze document
        print("Attempting to analyze non-resume document...")
        response = test_session.analyze_resume_structured()
        
        if response is None:
            print("No response received from analysis")
            return False
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Text: {response.text[:500]}...")  # Debug output
        
        # For non-resume, we expect either 400 (document not recognized as resume)
        # or 200 with is_resume=false
        if response.status_code == 400:
            # Document correctly identified as not a resume
            data = response.json()
            print("Non-resume document correctly rejected")
            print(f"   - Success: {data.get('success', False)}")
            print(f"   - Is Resume: {data.get('is_resume', False)}")
            print(f"   - Confidence: {data.get('confidence_score', 0):.2f}")
            print(f"   - Error: {data.get('error', 'Not specified')}")
            print(f"   - Message: {data.get('message', 'Not specified')}")
            
            return True
            
        elif response.status_code == 200:
            data = response.json()
            is_resume = data.get('is_resume', True)
            
            if not is_resume:
                print("Non-resume document correctly identified")
                print(f"   - Success: {data.get('success', False)}")
                print(f"   - Is Resume: {is_resume}")
                print(f"   - Confidence: {data.get('confidence_score', 0):.2f}")
                return True
            else:
                print("Document was incorrectly classified as resume")
                print(f"   - Is Resume: {is_resume}")
                print(f"   - Confidence: {data.get('confidence_score', 0):.2f}")
                return False
                
        else:
            print(f"Unexpected response code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        test_session.cleanup()

def test_server_connectivity():
    """Test if the server is running and accessible"""
    print("Testing Server Connectivity...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("Server is running and accessible")
            return True
        else:
            print(f"Server responded with status: {response.status_code}")
            return True  # Server is running, just different endpoint
    except requests.exceptions.ConnectionError:
        print("Cannot connect to server. Make sure Flask server is running on port 5000")
        return False
    except Exception as e:
        print(f"Error testing connectivity: {e}")
        return False

def check_file_existence():
    """Check if test PDF files exist"""
    print("Checking Test Files...")
    
    files_exist = True
    
    if os.path.exists(SAMPLE_RESUME_PATH):
        size = os.path.getsize(SAMPLE_RESUME_PATH) / 1024  # Size in KB
        print(f"{SAMPLE_RESUME_PATH} exists ({size:.1f} KB)")
    else:
        print(f"{SAMPLE_RESUME_PATH} not found")
        files_exist = False
    
    if os.path.exists(SAMPLE_NON_RESUME_PATH):
        size = os.path.getsize(SAMPLE_NON_RESUME_PATH) / 1024  # Size in KB
        print(f"{SAMPLE_NON_RESUME_PATH} exists ({size:.1f} KB)")
    else:
        print(f"{SAMPLE_NON_RESUME_PATH} not found")
        files_exist = False
    
    return files_exist

def main():
    """Run all tests"""
    print("Sample Resume Analysis Test Suite")
    print("=" * 70)
    print(f"Testing PDF files against resume analysis API")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 70)
    
    # Pre-flight checks
    if not check_file_existence():
        print("\n❌ Test files missing. Cannot proceed.")
        return
    
    if not test_server_connectivity():
        print("\n❌ Server not accessible. Cannot proceed.")
        return
    
    # Run tests
    tests_passed = 0
    total_tests = 2
    
    print("\nStarting Resume Analysis Tests...")
    
    if test_valid_resume_analysis():
        tests_passed += 1
    
    if test_non_resume_analysis():
        tests_passed += 1
    
    # Summary
    print("\n" + "="*70)
    print("Test Results Summary")
    print("="*70)
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    print(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("All tests passed!")
        print("   - sampleResume.pdf correctly analyzed as resume (200 response)")
        print("   - sampleResumeNo.pdf correctly identified as non-resume")
    else:
        print("Some tests failed. Check the implementation.")
        
        if tests_passed == 0:
            print("\nTroubleshooting:")
            print("   1. Ensure MongoDB is running (mongod)")
            print("   2. Ensure Redis is running (redis-server)")
            print("   3. Ensure Flask server is running (python server.py)")
            print("   4. Check GEMINI_API_KEY environment variable")
            print("   5. Verify PDF files exist in frontend/src/datasets/")
    
    print("\nAPI Endpoints Tested:")
    print("   POST /resume/upload")
    print("   POST /resume/analyze-structured")
    print("   DELETE /resume/current")

if __name__ == "__main__":
    main()