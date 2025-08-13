"""
Resume Parser and Text Extraction System with Gemini AI
Handles PDF resume parsing, text extraction, and AI-powered structured data extraction
"""
import os
import re
import io
import PyPDF2
import pdfplumber
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
import tempfile
from extensions import mongo
from flask_pymongo import ObjectId
import gridfs
import google.generativeai as genai

# Database collections
resumes_db = mongo.db.resumes
resume_analysis_db = mongo.db.resume_analysis
fs = gridfs.GridFS(mongo.db)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None
    print("Warning: GEMINI_API_KEY not found. Falling back to regex parsing.")

class ResumeParsingError(Exception):
    """Resume parsing error"""
    pass

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text from PDF content using multiple methods
    
    Args:
        pdf_content: PDF file content as bytes
    
    Returns:
        Extracted text string
    """
    text = ""
    
    # Method 1: Try pdfplumber first (better for complex layouts)
    try:
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
    
    # Method 2: Fallback to PyPDF2 if pdfplumber fails
    if not text.strip():
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")
    
    if not text.strip():
        raise ResumeParsingError("Unable to extract text from PDF")
    
    return text.strip()

def extract_resume_data_with_gemini(text: str) -> Dict:
    """Extract structured resume data using Gemini AI"""
    if not model:
        # Fallback to regex parsing if Gemini is not available
        return extract_resume_data_with_regex(text)
    
    try:
        prompt = f"""
You are a professional resume parser. Extract structured information from the following resume text.

Return the data in this exact JSON format:
{{
    "contact_info": {{
        "name": "Full name of the person (if found)",
        "emails": ["email1@example.com", "email2@example.com"],
        "phones": ["+61234567890", "0412345678"],
        "linkedin_urls": ["https://linkedin.com/in/username"],
        "websites": ["https://personalwebsite.com"],
        "location": "City, State/Country"
    }},
    "education": [
        {{
            "institution": "University/School name",
            "degree": "Degree type (Bachelor, Master, PhD, Diploma, Certificate)",
            "field": "Field of study",
            "year": "Graduation year",
            "raw_text": "Original text from resume"
        }}
    ],
    "work_experience": [
        {{
            "title": "Job title",
            "company": "Company name",
            "duration": "Employment duration",
            "start_date": "Start date",
            "end_date": "End date or 'Present'",
            "description": "Job description/responsibilities",
            "raw_text": "Original text from resume"
        }}
    ],
    "skills": ["skill1", "skill2", "skill3"],
    "certifications": ["certification1", "certification2"],
    "summary": "Professional summary or objective (if present)",
    "projects": [
        {{
            "name": "Project name",
            "description": "Project description",
            "technologies": ["tech1", "tech2"]
        }}
    ]
}}

Important guidelines:
- Extract only information that is clearly present in the text
- Use null or empty arrays for missing information
- Pay special attention to Australian phone number formats (+61, 04xx, etc.)
- Look for Australian universities and institutions
- Extract all technical and soft skills mentioned
- Preserve original formatting in raw_text fields
- If dates are unclear, extract what's available

Resume text:
{text}
"""
        
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean the response to extract JSON
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        parsed_data = json.loads(result_text)
        
        # Validate and clean the parsed data
        validated_data = {
            'contact_info': parsed_data.get('contact_info', {}),
            'education': parsed_data.get('education', []),
            'work_experience': parsed_data.get('work_experience', []),
            'skills': parsed_data.get('skills', []),
            'certifications': parsed_data.get('certifications', []),
            'summary': parsed_data.get('summary'),
            'projects': parsed_data.get('projects', [])
        }
        
        return validated_data
        
    except Exception as e:
        print(f"Gemini extraction failed: {e}")
        # Fallback to regex parsing
        return extract_resume_data_with_regex(text)

def extract_resume_data_with_regex(text: str) -> Dict:
    """Fallback regex-based extraction method"""
    # Email extraction
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = list(set(re.findall(email_pattern, text, re.IGNORECASE)))
    
    # Phone extraction (Australian patterns)
    phone_patterns = [
        r'\+61\s?\d{1}\s?\d{4}\s?\d{4}',
        r'\(0\d\)\s?\d{4}\s?\d{4}',
        r'0\d\s?\d{4}\s?\d{4}',
        r'\d{4}\s?\d{3}\s?\d{3}',
        r'\d{10}'
    ]
    phones = []
    for pattern in phone_patterns:
        phones.extend(re.findall(pattern, text))
    phones = list(set(phones))
    
    # LinkedIn URLs
    linkedin_pattern = r'https?://(?:www\.)?linkedin\.com/in/[\w-]+/?'
    linkedin_urls = list(set(re.findall(linkedin_pattern, text, re.IGNORECASE)))
    
    # Website URLs (excluding social media)
    url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?'
    all_urls = re.findall(url_pattern, text, re.IGNORECASE)
    websites = []
    for url in all_urls:
        if not any(domain in url.lower() for domain in ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com']):
            websites.append(url)
    websites = list(set(websites))
    
    # Basic skills extraction
    common_skills = [
        'python', 'java', 'javascript', 'react', 'nodejs', 'html', 'css', 'sql',
        'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
        'git', 'project management', 'leadership', 'communication', 'teamwork'
    ]
    found_skills = []
    text_lower = text.lower()
    for skill in common_skills:
        if skill.lower() in text_lower:
            found_skills.append(skill.title())
    
    return {
        'contact_info': {
            'emails': emails,
            'phones': phones,
            'linkedin_urls': linkedin_urls,
            'websites': websites
        },
        'education': [],  # Simplified for fallback
        'work_experience': [],  # Simplified for fallback
        'skills': found_skills,
        'certifications': [],
        'summary': None,
        'projects': []
    }

def parse_resume_content(pdf_content: bytes) -> Dict:
    """
    Parse resume content and extract structured information using Gemini AI
    
    Args:
        pdf_content: PDF file content as bytes
    
    Returns:
        Dictionary with parsed resume data
    """
    try:
        # Extract raw text
        raw_text = extract_text_from_pdf(pdf_content)
        
        # Extract structured information using Gemini AI
        gemini_data = extract_resume_data_with_gemini(raw_text)
        
        # Combine with raw text and metadata
        parsed_data = {
            'raw_text': raw_text,
            'contact_info': gemini_data.get('contact_info', {}),
            'education': gemini_data.get('education', []),
            'work_experience': gemini_data.get('work_experience', []),
            'skills': gemini_data.get('skills', []),
            'certifications': gemini_data.get('certifications', []),
            'summary': gemini_data.get('summary'),
            'projects': gemini_data.get('projects', []),
            'parsing_metadata': {
                'parsed_at': datetime.utcnow(),
                'text_length': len(raw_text),
                'word_count': len(raw_text.split()),
                'line_count': len(raw_text.split('\n')),
                'parsing_method': 'gemini_ai' if model else 'regex_fallback'
            }
        }
        
        return parsed_data
        
    except Exception as e:
        print(f"Error parsing resume content: {e}")
        raise ResumeParsingError(f"Failed to parse resume: {str(e)}")

def parse_resume_by_file_id(file_id: str) -> Dict:
    """
    Parse resume by GridFS file ID
    
    Args:
        file_id: GridFS file ID
    
    Returns:
        Dictionary with parsed resume data
    """
    try:
        # Get file from GridFS
        grid_out = fs.get(ObjectId(file_id))
        pdf_content = grid_out.read()
        
        # Parse the content
        parsed_data = parse_resume_content(pdf_content)
        
        # Add file metadata
        parsed_data['file_metadata'] = {
            'file_id': file_id,
            'filename': grid_out.filename,
            'upload_date': grid_out.upload_date,
            'file_size': grid_out.length,
            'content_type': grid_out.content_type
        }
        
        return parsed_data
        
    except gridfs.errors.NoFile:
        raise ResumeParsingError(f"Resume file not found: {file_id}")
    except Exception as e:
        print(f"Error parsing resume by file ID: {e}")
        raise ResumeParsingError(f"Failed to parse resume: {str(e)}")

def save_parsed_resume(user_id: str, file_id: str, parsed_data: Dict) -> str:
    """
    Save parsed resume data to database
    
    Args:
        user_id: User ID
        file_id: GridFS file ID
        parsed_data: Parsed resume data
    
    Returns:
        Analysis ID
    """
    try:
        analysis_doc = {
            'user_id': ObjectId(user_id),
            'file_id': ObjectId(file_id),
            'parsed_data': parsed_data,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Remove or replace existing analysis for this file
        resume_analysis_db.delete_many({
            'user_id': ObjectId(user_id),
            'file_id': ObjectId(file_id)
        })
        
        result = resume_analysis_db.insert_one(analysis_doc)
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error saving parsed resume: {e}")
        raise ResumeParsingError("Failed to save parsed resume data")

def get_parsed_resume(user_id: str, file_id: str = None) -> Optional[Dict]:
    """
    Get parsed resume data from database
    
    Args:
        user_id: User ID
        file_id: Optional file ID (if not provided, gets most recent)
    
    Returns:
        Parsed resume data or None
    """
    try:
        query = {'user_id': ObjectId(user_id)}
        if file_id:
            query['file_id'] = ObjectId(file_id)
        
        analysis = resume_analysis_db.find_one(
            query,
            sort=[('created_at', -1)]  # Get most recent if multiple
        )
        
        if analysis:
            # Convert ObjectIds to strings for JSON serialization
            analysis['_id'] = str(analysis['_id'])
            analysis['user_id'] = str(analysis['user_id'])
            analysis['file_id'] = str(analysis['file_id'])
            
            return analysis
        
        return None
        
    except Exception as e:
        print(f"Error getting parsed resume: {e}")
        return None

def analyze_resume_completeness(parsed_data: Dict) -> Dict:
    """
    Analyze resume completeness and provide recommendations using Gemini AI analysis
    
    Args:
        parsed_data: Parsed resume data from Gemini
    
    Returns:
        Dictionary with completeness analysis
    """
    try:
        if not model:
            return analyze_resume_completeness_traditional(parsed_data)
        
        # Use Gemini for intelligent completeness analysis
        resume_text = parsed_data.get('raw_text', '')
        
        prompt = f"""
You are a professional resume consultant. Analyze this resume for completeness and provide recommendations.

Resume content:
{resume_text}

Provide analysis in this JSON format:
{{
    "completeness_score": 85,
    "total_possible": 100,
    "percentage": 85.0,
    "rating": "Good|Fair|Excellent|Needs Improvement",
    "missing_sections": ["section1", "section2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "strengths": ["strength1", "strength2"],
    "ats_compatibility": {{
        "score": 80,
        "issues": ["issue1", "issue2"],
        "suggestions": ["suggestion1", "suggestion2"]
    }}
}}

Evaluation criteria:
- Contact information (email, phone) - 25 points
- Professional summary/objective - 15 points  
- Work experience with details - 30 points
- Education background - 15 points
- Skills section - 10 points
- Additional sections (certifications, projects, etc.) - 5 points

Consider:
- Clarity and organization
- Relevant keywords for ATS systems
- Quantified achievements
- Professional formatting
- Industry-specific requirements for Australian job market
"""
        
        try:
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean the response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            analysis = json.loads(result_text)
            return analysis
            
        except Exception as e:
            print(f"Gemini completeness analysis failed: {e}")
            return analyze_resume_completeness_traditional(parsed_data)
        
    except Exception as e:
        print(f"Error analyzing resume completeness: {e}")
        return {
            'error': 'Failed to analyze resume completeness',
            'percentage': 0
        }

def analyze_resume_completeness_traditional(parsed_data: Dict) -> Dict:
    """
    Traditional completeness analysis as fallback
    """
    completeness_score = 0
    total_criteria = 0
    missing_sections = []
    recommendations = []
    
    # Check contact information
    contact_info = parsed_data.get('contact_info', {})
    if contact_info.get('emails'):
        completeness_score += 15
    else:
        missing_sections.append('Email address')
        recommendations.append('Add a professional email address')
    total_criteria += 15
    
    if contact_info.get('phones'):
        completeness_score += 10
    else:
        missing_sections.append('Phone number')
        recommendations.append('Add a contact phone number')
    total_criteria += 10
    
    # Check education section
    education = parsed_data.get('education', [])
    if education:
        completeness_score += 20
    else:
        missing_sections.append('Education')
        recommendations.append('Add education background')
    total_criteria += 20
    
    # Check work experience
    work_experience = parsed_data.get('work_experience', [])
    if work_experience:
        completeness_score += 25
        if len(work_experience) >= 2:
            completeness_score += 5  # Bonus for multiple experiences
    else:
        missing_sections.append('Work experience')
        recommendations.append('Add work experience details')
    total_criteria += 25
    
    # Check skills section
    skills = parsed_data.get('skills', [])
    if skills:
        completeness_score += 20
        if len(skills) >= 5:
            completeness_score += 5  # Bonus for comprehensive skills list
    else:
        missing_sections.append('Skills')
        recommendations.append('Add relevant skills')
    total_criteria += 20
    
    # Check LinkedIn profile
    if contact_info.get('linkedin_urls'):
        completeness_score += 10
    else:
        missing_sections.append('LinkedIn profile')
        recommendations.append('Add LinkedIn profile URL')
    total_criteria += 10
    
    # Calculate percentage
    completeness_percentage = (completeness_score / total_criteria) * 100 if total_criteria > 0 else 0
    
    # Determine rating
    if completeness_percentage >= 90:
        rating = 'Excellent'
    elif completeness_percentage >= 75:
        rating = 'Good'
    elif completeness_percentage >= 60:
        rating = 'Fair'
    else:
        rating = 'Needs Improvement'
    
    return {
        'completeness_score': completeness_score,
        'total_possible': total_criteria,
        'percentage': round(completeness_percentage, 1),
        'rating': rating,
        'missing_sections': missing_sections,
        'recommendations': recommendations
    }