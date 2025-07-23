"""
Resume Parser and Text Extraction System
Handles PDF resume parsing, text extraction, and structured data extraction
"""
import os
import re
import io
import PyPDF2
import pdfplumber
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
import tempfile
from extensions import mongo
from flask_pymongo import ObjectId
import gridfs

# Database collections
resumes_db = mongo.db.resumes
resume_analysis_db = mongo.db.resume_analysis
fs = gridfs.GridFS(mongo.db)

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

def extract_email_addresses(text: str) -> List[str]:
    """Extract email addresses from text"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text, re.IGNORECASE)
    return list(set(emails))  # Remove duplicates

def extract_phone_numbers(text: str) -> List[str]:
    """Extract phone numbers from text"""
    # Australian phone number patterns
    phone_patterns = [
        r'\+61\s?\d{1}\s?\d{4}\s?\d{4}',  # +61 x xxxx xxxx
        r'\(0\d\)\s?\d{4}\s?\d{4}',       # (0x) xxxx xxxx
        r'0\d\s?\d{4}\s?\d{4}',           # 0x xxxx xxxx
        r'\d{4}\s?\d{3}\s?\d{3}',         # xxxx xxx xxx
        r'\d{10}',                        # xxxxxxxxxx
    ]
    
    phones = []
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        phones.extend(matches)
    
    return list(set(phones))  # Remove duplicates

def extract_linkedin_urls(text: str) -> List[str]:
    """Extract LinkedIn URLs from text"""
    linkedin_pattern = r'https?://(?:www\.)?linkedin\.com/in/[\w-]+/?'
    urls = re.findall(linkedin_pattern, text, re.IGNORECASE)
    return list(set(urls))

def extract_websites(text: str) -> List[str]:
    """Extract website URLs from text"""
    url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?'
    urls = re.findall(url_pattern, text, re.IGNORECASE)
    
    # Filter out common non-personal websites
    filtered_urls = []
    for url in urls:
        if not any(domain in url.lower() for domain in ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com']):
            filtered_urls.append(url)
    
    return list(set(filtered_urls))

def extract_education(text: str) -> List[Dict]:
    """Extract education information from text"""
    education_keywords = [
        'university', 'college', 'bachelor', 'master', 'phd', 'degree',
        'diploma', 'certificate', 'graduate', 'undergraduate', 'mba',
        'bsc', 'ba', 'msc', 'ma', 'btec', 'tafe'
    ]
    
    # Common Australian universities
    australian_unis = [
        'university of melbourne', 'university of sydney', 'australian national university',
        'university of queensland', 'university of new south wales', 'monash university',
        'university of western australia', 'university of adelaide', 'macquarie university',
        'griffith university', 'deakin university', 'rmit university', 'uts',
        'university of technology sydney', 'curtin university', 'swinburne university'
    ]
    
    education_entries = []
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Check if line contains education keywords
        if any(keyword in line_lower for keyword in education_keywords):
            education_entry = {
                'raw_text': line.strip(),
                'institution': None,
                'degree': None,
                'field': None,
                'year': None
            }
            
            # Extract year
            year_match = re.search(r'\b(19|20)\d{2}\b', line)
            if year_match:
                education_entry['year'] = year_match.group()
            
            # Check for Australian universities
            for uni in australian_unis:
                if uni in line_lower:
                    education_entry['institution'] = uni.title()
                    break
            
            # Extract degree type
            degree_patterns = {
                'bachelor': r'\b(?:bachelor|ba|bs|bsc|beng|bcom|bbus)\b',
                'master': r'\b(?:master|ma|ms|msc|meng|mcom|mba)\b',
                'phd': r'\b(?:phd|doctorate|ph\.d)\b',
                'diploma': r'\b(?:diploma|dip)\b',
                'certificate': r'\b(?:certificate|cert)\b'
            }
            
            for degree_type, pattern in degree_patterns.items():
                if re.search(pattern, line_lower):
                    education_entry['degree'] = degree_type.title()
                    break
            
            education_entries.append(education_entry)
    
    return education_entries

def extract_work_experience(text: str) -> List[Dict]:
    """Extract work experience from text"""
    experience_keywords = [
        'experience', 'employment', 'work history', 'career', 'professional',
        'positions', 'roles', 'worked at', 'employed', 'job'
    ]
    
    # Common job titles
    job_titles = [
        'manager', 'director', 'analyst', 'developer', 'engineer', 'consultant',
        'specialist', 'coordinator', 'administrator', 'assistant', 'officer',
        'supervisor', 'lead', 'senior', 'junior', 'intern', 'graduate'
    ]
    
    experience_entries = []
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Check if line contains job titles or experience keywords
        if any(title in line_lower for title in job_titles) or any(keyword in line_lower for keyword in experience_keywords):
            experience_entry = {
                'raw_text': line.strip(),
                'title': None,
                'company': None,
                'duration': None,
                'years': []
            }
            
            # Extract years
            year_matches = re.findall(r'\b(19|20)\d{2}\b', line)
            if year_matches:
                experience_entry['years'] = year_matches
            
            # Extract duration patterns (e.g., "2019-2021", "Jan 2020 - Dec 2021")
            duration_patterns = [
                r'\b(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}\b',
                r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(19|20)\d{2}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(19|20)\d{2}\b'
            ]
            
            for pattern in duration_patterns:
                match = re.search(pattern, line_lower)
                if match:
                    experience_entry['duration'] = match.group()
                    break
            
            # Try to identify job title (usually the first part before company name)
            for title in job_titles:
                if title in line_lower:
                    # Find the context around the title
                    title_match = re.search(rf'\b{re.escape(title)}\b', line, re.IGNORECASE)
                    if title_match:
                        start = max(0, title_match.start() - 20)
                        end = min(len(line), title_match.end() + 20)
                        experience_entry['title'] = line[start:end].strip()
                        break
            
            experience_entries.append(experience_entry)
    
    return experience_entries

def extract_skills(text: str) -> List[str]:
    """Extract skills from resume text"""
    # Common technical skills
    tech_skills = [
        'python', 'java', 'javascript', 'react', 'nodejs', 'html', 'css', 'sql',
        'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
        'git', 'linux', 'windows', 'api', 'rest', 'json', 'xml', 'agile', 'scrum',
        'django', 'flask', 'spring', 'angular', 'vue', 'typescript', 'php', 'ruby',
        'golang', 'rust', 'scala', 'kotlin', 'swift', 'objective-c', 'c++', 'c#',
        'terraform', 'ansible', 'jenkins', 'gitlab', 'github', 'jira', 'confluence'
    ]
    
    # Business skills
    business_skills = [
        'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
        'analytical', 'strategic planning', 'budget management', 'stakeholder management',
        'risk management', 'quality assurance', 'process improvement', 'training',
        'mentoring', 'negotiation', 'presentation', 'customer service', 'sales',
        'marketing', 'business analysis', 'data analysis', 'reporting'
    ]
    
    all_skills = tech_skills + business_skills
    found_skills = []
    text_lower = text.lower()
    
    for skill in all_skills:
        if skill.lower() in text_lower:
            found_skills.append(skill.title())
    
    # Look for skills in dedicated skills sections
    skills_section_patterns = [
        r'skills?\s*:?\s*(.+?)(?:\n\n|\n[A-Z]|\n\s*$)',
        r'technical skills?\s*:?\s*(.+?)(?:\n\n|\n[A-Z]|\n\s*$)',
        r'competencies\s*:?\s*(.+?)(?:\n\n|\n[A-Z]|\n\s*$)'
    ]
    
    for pattern in skills_section_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            # Split by common delimiters
            skills_text = match.replace('•', ',').replace('|', ',').replace(';', ',')
            potential_skills = [skill.strip() for skill in skills_text.split(',')]
            
            for skill in potential_skills:
                skill = skill.strip()
                if len(skill) > 1 and len(skill) < 50:  # Reasonable skill length
                    found_skills.append(skill.title())
    
    return list(set(found_skills))  # Remove duplicates

def parse_resume_content(pdf_content: bytes) -> Dict:
    """
    Parse resume content and extract structured information
    
    Args:
        pdf_content: PDF file content as bytes
    
    Returns:
        Dictionary with parsed resume data
    """
    try:
        # Extract raw text
        raw_text = extract_text_from_pdf(pdf_content)
        
        # Extract structured information
        parsed_data = {
            'raw_text': raw_text,
            'contact_info': {
                'emails': extract_email_addresses(raw_text),
                'phones': extract_phone_numbers(raw_text),
                'linkedin_urls': extract_linkedin_urls(raw_text),
                'websites': extract_websites(raw_text)
            },
            'education': extract_education(raw_text),
            'work_experience': extract_work_experience(raw_text),
            'skills': extract_skills(raw_text),
            'parsing_metadata': {
                'parsed_at': datetime.utcnow(),
                'text_length': len(raw_text),
                'word_count': len(raw_text.split()),
                'line_count': len(raw_text.split('\n'))
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
    Analyze resume completeness and provide recommendations
    
    Args:
        parsed_data: Parsed resume data
    
    Returns:
        Dictionary with completeness analysis
    """
    try:
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
        
    except Exception as e:
        print(f"Error analyzing resume completeness: {e}")
        return {
            'error': 'Failed to analyze resume completeness',
            'percentage': 0
        }