#!/usr/bin/env python3
"""
Test script for Gemini structured resume analysis
"""
import os
import sys
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from gemini_resume_analyzer import (
    analyze_resume_with_gemini_structured,
    validate_and_clean_resume_data,
    analyze_resume_completeness_structured
)

# Sample resume text for testing
SAMPLE_RESUME_TEXT = """
John Smith
Software Engineer
Email: john.smith@email.com
Phone: +61 432 123 456
LinkedIn: https://linkedin.com/in/johnsmith
Location: Sydney, NSW

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications using modern technologies.
Passionate about creating efficient, scalable solutions and mentoring junior developers.

WORK EXPERIENCE

Senior Software Engineer
TechCorp Australia | Sydney, NSW | Jan 2022 - Present
• Led development of microservices architecture serving 1M+ users
• Implemented CI/CD pipelines reducing deployment time by 60%
• Mentored team of 4 junior developers
• Technologies: Python, React, AWS, Docker, Kubernetes

Software Engineer
StartupXYZ | Melbourne, VIC | Jun 2020 - Dec 2021
• Built full-stack web applications using React and Node.js
• Optimized database queries improving performance by 40%
• Collaborated with cross-functional teams in agile environment
• Technologies: JavaScript, PostgreSQL, MongoDB, Git

Junior Developer
WebSolutions Ltd | Brisbane, QLD | Mar 2019 - May 2020
• Developed responsive websites using HTML, CSS, JavaScript
• Fixed bugs and implemented new features
• Participated in code reviews and team meetings

EDUCATION

Bachelor of Computer Science
University of Technology Sydney | Sydney, NSW | 2019
GPA: 3.8/4.0
Relevant coursework: Data Structures, Algorithms, Software Engineering

TECHNICAL SKILLS
• Programming Languages: Python, JavaScript, Java, C++
• Frameworks: React, Node.js, Django, Flask
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, Jenkins, Jira, VS Code

CERTIFICATIONS
• AWS Solutions Architect Associate | Amazon Web Services | 2023
• Certified Scrum Master | Scrum Alliance | 2022

PROJECTS
Personal Portfolio Website
Built a responsive portfolio website using React and deployed on AWS
Technologies: React, CSS, AWS S3, CloudFront
URL: https://johnsmith-portfolio.com

E-commerce API
Developed RESTful API for e-commerce platform
Technologies: Python, Django, PostgreSQL, Redis
Role: Lead Developer

LANGUAGES
• English: Native
• Mandarin: Conversational
"""

# Sample non-resume text for testing
NON_RESUME_TEXT = """
Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position at your company.
I have been following your company's work and am impressed by your innovative approach.

I believe my skills in Python and React would be valuable to your team. I have attached
my resume for your consideration.

Thank you for your time and consideration.

Best regards,
John Smith
"""

def test_gemini_api_key():
    """Test if Gemini API key is configured"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment variables")
        print("Please set your Gemini API key:")
        print("export GEMINI_API_KEY='your_key_here'")
        return False
    else:
        print(f"✅ GEMINI_API_KEY configured (length: {len(api_key)})")
        return True

def test_resume_analysis():
    """Test resume analysis with sample resume"""
    print("\n" + "="*50)
    print("Testing Resume Analysis")
    print("="*50)
    
    try:
        # Analyze sample resume
        result = analyze_resume_with_gemini_structured(SAMPLE_RESUME_TEXT)
        
        if result.get('success'):
            print("✅ Gemini analysis successful")
            print(f"   - Is Resume: {result['is_resume']}")
            print(f"   - Confidence: {result['confidence_score']:.2f}")
            print(f"   - Model: {result.get('model', 'unknown')}")
            
            # Validate data
            validation_result = validate_and_clean_resume_data(result['structured_data'])
            print(f"   - Valid Resume: {validation_result['is_valid_resume']}")
            print(f"   - Validation Score: {validation_result.get('validation_score', 0):.2f}")
            
            # Show extracted data summary
            structured_data = validation_result['structured_data']
            print("\n📋 Extracted Data Summary:")
            print(f"   - Name: {structured_data.get('contact_info', {}).get('full_name', 'Not found')}")
            print(f"   - Email: {structured_data.get('contact_info', {}).get('email', 'Not found')}")
            print(f"   - Work Experience: {len(structured_data.get('work_experience', []))} entries")
            print(f"   - Education: {len(structured_data.get('education', []))} entries")
            print(f"   - Skills: {len(structured_data.get('skills', []))} skills")
            print(f"   - Certifications: {len(structured_data.get('certifications', []))} certifications")
            print(f"   - Projects: {len(structured_data.get('projects', []))} projects")
            print(f"   - Total Experience: {structured_data.get('total_experience_years', 'Not calculated')} years")
            print(f"   - Industry Focus: {structured_data.get('industry_focus', 'Not identified')}")
            
            # Test completeness analysis
            completeness = analyze_resume_completeness_structured(structured_data)
            print(f"\n📊 Completeness Score: {completeness.get('completeness_score', 0):.1f}%")
            
            if completeness.get('feedback'):
                print("💡 Improvement Suggestions:")
                for suggestion in completeness['feedback'][:3]:  # Show first 3
                    print(f"   - {suggestion}")
            
            return True
            
        else:
            print("❌ Gemini analysis failed")
            print(f"   - Error: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_non_resume_detection():
    """Test detection of non-resume documents"""
    print("\n" + "="*50)
    print("Testing Non-Resume Detection")
    print("="*50)
    
    try:
        # Analyze non-resume text
        result = analyze_resume_with_gemini_structured(NON_RESUME_TEXT)
        
        if result.get('success'):
            print("✅ Analysis completed")
            print(f"   - Is Resume: {result['is_resume']}")
            print(f"   - Confidence: {result['confidence_score']:.2f}")
            
            # Validate data
            validation_result = validate_and_clean_resume_data(result['structured_data'])
            print(f"   - Valid Resume: {validation_result['is_valid_resume']}")
            
            if not result['is_resume'] or not validation_result['is_valid_resume']:
                print("✅ Correctly identified as non-resume")
                return True
            else:
                print("⚠️  Document was incorrectly classified as resume")
                return False
                
        else:
            print("❌ Analysis failed")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Gemini Structured Resume Analysis Test Suite")
    print("=" * 60)
    
    # Test API key
    if not test_gemini_api_key():
        print("\n❌ Cannot proceed without API key")
        return
    
    # Run tests
    tests_passed = 0
    total_tests = 2
    
    if test_resume_analysis():
        tests_passed += 1
    
    if test_non_resume_detection():
        tests_passed += 1
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Results Summary")
    print("="*60)
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! The implementation is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
    
    print("\n🚀 Ready to use the new structured resume analysis API:")
    print("   POST /api/resume/analyze-structured")
    print("   GET  /api/resume/structured-data")

if __name__ == "__main__":
    main()