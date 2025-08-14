"""
Gemini-powered Resume Analysis with Structured Output
Uses Google Gemini 2.5 Flash for intelligent resume extraction and validation
"""
import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum
import google.generativeai as genai
from extensions import mongo

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Database collections will be accessed within functions when Flask app context is available


class ContactInfo(BaseModel):
    """Contact information extracted from resume"""
    full_name: Optional[str] = Field(None, description="Full name of the candidate")
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn profile URL")
    location: Optional[str] = Field(None, description="Current location/address")
    website: Optional[str] = Field(None, description="Personal website or portfolio URL")


class WorkExperience(BaseModel):
    """Work experience entry"""
    job_title: str = Field(..., description="Job title or position")
    company_name: str = Field(..., description="Company or organization name")
    location: Optional[str] = Field(None, description="Job location")
    start_date: Optional[str] = Field(None, description="Start date (formatted as text)")
    end_date: Optional[str] = Field(None, description="End date or 'Present' if current")
    duration: Optional[str] = Field(None, description="Duration of employment")
    responsibilities: List[str] = Field(default_factory=list, description="Key responsibilities and achievements")
    technologies: List[str] = Field(default_factory=list, description="Technologies or tools used")


class Education(BaseModel):
    """Education entry"""
    degree: str = Field(..., description="Degree type and major")
    institution: str = Field(..., description="Educational institution name")
    location: Optional[str] = Field(None, description="Institution location")
    graduation_year: Optional[str] = Field(None, description="Graduation year")
    gpa: Optional[str] = Field(None, description="GPA if mentioned")
    honors: List[str] = Field(default_factory=list, description="Honors, awards, or distinctions")


class Certification(BaseModel):
    """Certification or license"""
    name: str = Field(..., description="Certification name")
    issuing_organization: Optional[str] = Field(None, description="Organization that issued the certification")
    issue_date: Optional[str] = Field(None, description="Date issued")
    expiry_date: Optional[str] = Field(None, description="Expiry date if applicable")
    credential_id: Optional[str] = Field(None, description="Credential ID if provided")


class Project(BaseModel):
    """Project entry"""
    name: str = Field(..., description="Project name")
    description: str = Field(..., description="Project description")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")
    duration: Optional[str] = Field(None, description="Project duration")
    url: Optional[str] = Field(None, description="Project URL if available")
    role: Optional[str] = Field(None, description="Role in the project")


class Language(BaseModel):
    """Language proficiency"""
    language: str = Field(..., description="Language name")
    proficiency: Optional[str] = Field(None, description="Proficiency level (e.g., Native, Fluent, Intermediate)")


class StructuredResumeData(BaseModel):
    """Complete structured resume data extracted by Gemini"""
    isResume: bool = Field(..., description="Whether the document is actually a resume/CV")
    confidence_score: float = Field(..., description="Confidence score (0.0-1.0) that this is a resume")
    
    # Core resume sections
    contact_info: ContactInfo = Field(default_factory=ContactInfo, description="Contact information")
    professional_summary: Optional[str] = Field(None, description="Professional summary or objective")
    work_experience: List[WorkExperience] = Field(default_factory=list, description="Work experience entries")
    education: List[Education] = Field(default_factory=list, description="Education entries")
    skills: List[str] = Field(default_factory=list, description="Technical and soft skills")
    certifications: List[Certification] = Field(default_factory=list, description="Certifications and licenses")
    projects: List[Project] = Field(default_factory=list, description="Notable projects")
    languages: List[Language] = Field(default_factory=list, description="Language proficiencies")
    
    # Metadata
    document_type: Optional[str] = Field(None, description="Type of document (Resume, CV, etc.)")
    total_experience_years: Optional[float] = Field(None, description="Estimated total years of experience")
    industry_focus: Optional[str] = Field(None, description="Primary industry or field")
    seniority_level: Optional[str] = Field(None, description="Seniority level (Entry, Mid, Senior, Executive)")
    
    # Analysis metadata
    extracted_at: datetime = Field(default_factory=datetime.utcnow, description="When extraction was performed")
    extraction_method: str = Field("gemini_structured", description="Method used for extraction")
    
    @validator('confidence_score')
    def validate_confidence(cls, v):
        return max(0.0, min(1.0, v))


class GeminiAnalysisError(Exception):
    """Gemini analysis specific error"""
    pass


def analyze_resume_with_gemini_structured(resume_text: str) -> Dict[str, Any]:
    """
    Analyze resume using Gemini's structured output capabilities
    
    Args:
        resume_text: Extracted text from the resume document
        
    Returns:
        Dictionary containing structured resume data or error information
    """
    if not GEMINI_API_KEY:
        raise GeminiAnalysisError("Gemini API key not configured")
    
    try:
        # Initialize the model with structured output
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=StructuredResumeData
            )
        )
        
        # Construct the analysis prompt
        prompt = f"""
        Analyze the following document and extract structured resume information. 
        
        CRITICAL: First determine if this document is actually a resume/CV. If it's not a resume 
        (e.g., it's a cover letter, job description, random text, etc.), set isResume to false 
        and confidence_score to a low value (0.0-0.3).
        
        If it IS a resume, extract all available information into the structured format and set 
        isResume to true with an appropriate confidence_score (0.7-1.0).
        
        Document to analyze:
        {resume_text}
        
        Instructions:
        1. Determine if this is a resume/CV document
        2. If not a resume, set isResume=false and minimal extraction
        3. If it is a resume, extract all available information comprehensively
        4. Be thorough in extracting skills, experience, education, and projects
        5. Parse dates and durations carefully
        6. Identify technologies and tools mentioned
        7. Estimate experience level and industry focus
        8. Extract contact information accurately
        
        Return the structured data in JSON format matching the StructuredResumeData schema.
        """
        
        # Generate structured response
        response = model.generate_content(prompt)
        
        if not response.text:
            raise GeminiAnalysisError("No response received from Gemini")
        
        # Parse the JSON response
        try:
            structured_data = json.loads(response.text)
            
            # Validate that required fields exist
            if 'isResume' not in structured_data:
                structured_data['isResume'] = True  # Default assumption
                structured_data['confidence_score'] = 0.5
            
            # Add extraction metadata
            structured_data['extracted_at'] = datetime.utcnow().isoformat()
            structured_data['extraction_method'] = 'gemini_structured'
            
            return {
                'success': True,
                'structured_data': structured_data,
                'raw_response': response.text,
                'model': 'gemini-2.5-flash',
                'is_resume': structured_data.get('isResume', True),
                'confidence_score': structured_data.get('confidence_score', 0.5)
            }
            
        except json.JSONDecodeError as e:
            raise GeminiAnalysisError(f"Failed to parse JSON response: {str(e)}")
        
    except Exception as e:
        print(f"Gemini structured analysis error: {e}")
        raise GeminiAnalysisError(f"Gemini analysis failed: {str(e)}")


def validate_and_clean_resume_data(structured_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean the structured resume data
    
    Args:
        structured_data: Raw structured data from Gemini
        
    Returns:
        Validated and cleaned data
    """
    try:
        # Create and validate the structured data model
        resume_data = StructuredResumeData(**structured_data)
        
        # Convert back to dict for storage
        clean_data = resume_data.dict()
        
        # Additional validation rules
        if not clean_data['isResume'] or clean_data['confidence_score'] < 0.5:
            print(f"Document validation failed: isResume={clean_data['isResume']}, confidence={clean_data['confidence_score']}")
            return {
                'is_valid_resume': False,
                'validation_error': 'Document is not recognized as a resume or has low confidence',
                'confidence_score': clean_data['confidence_score'],
                'structured_data': clean_data
            }
        
        # Validate required sections for a good resume
        validation_score = 0
        total_checks = 5
        
        # Check contact info
        if clean_data['contact_info']['full_name'] or clean_data['contact_info']['email']:
            validation_score += 1
            
        # Check work experience
        if clean_data['work_experience']:
            validation_score += 1
            
        # Check education
        if clean_data['education']:
            validation_score += 1
            
        # Check skills
        if clean_data['skills']:
            validation_score += 1
            
        # Check overall content quality
        if (len(clean_data['work_experience']) >= 1 or 
            len(clean_data['projects']) >= 1 or 
            clean_data['professional_summary']):
            validation_score += 1
        
        validation_ratio = validation_score / total_checks
        
        return {
            'is_valid_resume': validation_ratio >= 0.6,  # At least 60% of checks pass
            'validation_score': validation_ratio,
            'structured_data': clean_data,
            'validation_details': {
                'has_contact_info': bool(clean_data['contact_info']['full_name'] or clean_data['contact_info']['email']),
                'has_experience': bool(clean_data['work_experience']),
                'has_education': bool(clean_data['education']),
                'has_skills': bool(clean_data['skills']),
                'has_content': bool(len(clean_data['work_experience']) >= 1 or len(clean_data['projects']) >= 1)
            }
        }
        
    except Exception as e:
        print(f"Validation error: {e}")
        return {
            'is_valid_resume': False,
            'validation_error': f'Data validation failed: {str(e)}',
            'structured_data': structured_data
        }


def save_structured_resume_data(user_id: str, file_id: str, structured_data: Dict[str, Any], 
                               validation_result: Dict[str, Any]) -> Optional[str]:
    """
    Save structured resume data to database if it's a valid resume
    
    Args:
        user_id: User ID
        file_id: Resume file ID
        structured_data: Structured resume data
        validation_result: Validation results
        
    Returns:
        Document ID if saved, None if not saved (invalid resume)
    """
    try:
        # Only save if it's a valid resume
        if not validation_result.get('is_valid_resume', False):
            print(f"Not saving resume data - validation failed: {validation_result.get('validation_error', 'Unknown error')}")
            return None
        
        # Prepare document for storage
        resume_doc = {
            'user_id': user_id,
            'file_id': file_id,
            'structured_data': structured_data,
            'validation_result': validation_result,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'extraction_version': '1.0'
        }
        
        # Get database collection
        structured_resume_db = mongo.db.structured_resumes
        
        # Check if we already have data for this file
        existing = structured_resume_db.find_one({'file_id': file_id})
        
        if existing:
            # Update existing record
            structured_resume_db.update_one(
                {'file_id': file_id},
                {'$set': {
                    'structured_data': structured_data,
                    'validation_result': validation_result,
                    'updated_at': datetime.utcnow()
                }}
            )
            return str(existing['_id'])
        else:
            # Insert new record
            result = structured_resume_db.insert_one(resume_doc)
            return str(result.inserted_id)
            
    except Exception as e:
        print(f"Error saving structured resume data: {e}")
        return None


def get_structured_resume_data(user_id: str, file_id: str = None) -> Optional[Dict[str, Any]]:
    """
    Get structured resume data from database
    
    Args:
        user_id: User ID
        file_id: Optional specific file ID
        
    Returns:
        Structured resume data or None
    """
    try:
        # Get database collection
        structured_resume_db = mongo.db.structured_resumes
        
        query = {'user_id': user_id}
        if file_id:
            query['file_id'] = file_id
        
        resume_data = structured_resume_db.find_one(
            query,
            sort=[('created_at', -1)]
        )
        
        if resume_data:
            resume_data['_id'] = str(resume_data['_id'])
            return resume_data
        
        return None
        
    except Exception as e:
        print(f"Error getting structured resume data: {e}")
        return None


def analyze_resume_completeness_structured(structured_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze resume completeness based on structured data
    
    Args:
        structured_data: Structured resume data
        
    Returns:
        Completeness analysis
    """
    try:
        completeness_score = 0
        max_score = 100
        feedback = []
        
        # Contact information (20 points)
        contact_info = structured_data.get('contact_info', {})
        contact_score = 0
        
        if contact_info.get('full_name'):
            contact_score += 5
        else:
            feedback.append("Add your full name")
            
        if contact_info.get('email'):
            contact_score += 5
        else:
            feedback.append("Add your email address")
            
        if contact_info.get('phone'):
            contact_score += 3
        else:
            feedback.append("Add your phone number")
            
        if contact_info.get('linkedin_url'):
            contact_score += 4
        else:
            feedback.append("Add your LinkedIn profile")
            
        if contact_info.get('location'):
            contact_score += 3
        else:
            feedback.append("Add your location")
            
        completeness_score += contact_score
        
        # Work experience (30 points)
        work_experience = structured_data.get('work_experience', [])
        exp_score = 0
        
        if len(work_experience) >= 2:
            exp_score += 20
        elif len(work_experience) == 1:
            exp_score += 15
            feedback.append("Add more work experience entries")
        else:
            exp_score += 0
            feedback.append("Add work experience")
            
        # Check experience detail quality
        detailed_experiences = [exp for exp in work_experience 
                              if exp.get('responsibilities') and len(exp['responsibilities']) >= 2]
        
        if len(detailed_experiences) >= len(work_experience) * 0.8:
            exp_score += 10
        else:
            exp_score += 5
            feedback.append("Add more detailed responsibilities to your experience")
            
        completeness_score += exp_score
        
        # Education (15 points)
        education = structured_data.get('education', [])
        if education:
            completeness_score += 15
        else:
            feedback.append("Add your educational background")
            
        # Skills (20 points)
        skills = structured_data.get('skills', [])
        skill_score = 0
        
        if len(skills) >= 8:
            skill_score += 20
        elif len(skills) >= 5:
            skill_score += 15
            feedback.append("Add more relevant skills")
        elif len(skills) >= 2:
            skill_score += 10
            feedback.append("Add more skills to improve your profile")
        else:
            feedback.append("Add your technical and soft skills")
            
        completeness_score += skill_score
        
        # Professional summary (10 points)
        if structured_data.get('professional_summary'):
            completeness_score += 10
        else:
            feedback.append("Add a professional summary")
            
        # Bonus points for additional sections (5 points)
        bonus_score = 0
        
        if structured_data.get('certifications'):
            bonus_score += 2
        if structured_data.get('projects'):
            bonus_score += 2
        if structured_data.get('languages'):
            bonus_score += 1
            
        completeness_score += bonus_score
        
        # Calculate percentage
        completeness_percentage = min(100, (completeness_score / max_score) * 100)
        
        return {
            'completeness_score': round(completeness_percentage, 1),
            'feedback': feedback,
            'section_scores': {
                'contact_info': round((contact_score / 20) * 100, 1),
                'work_experience': round((exp_score / 30) * 100, 1),
                'education': 100 if education else 0,
                'skills': round((skill_score / 20) * 100, 1),
                'professional_summary': 100 if structured_data.get('professional_summary') else 0,
                'bonus_sections': round((bonus_score / 5) * 100, 1)
            },
            'recommendations': generate_improvement_recommendations(structured_data, completeness_percentage)
        }
        
    except Exception as e:
        print(f"Error analyzing completeness: {e}")
        return {
            'completeness_score': 0,
            'error': f'Analysis failed: {str(e)}'
        }


def generate_improvement_recommendations(structured_data: Dict[str, Any], 
                                       completeness_score: float) -> List[Dict[str, str]]:
    """Generate specific improvement recommendations"""
    recommendations = []
    
    # Critical improvements (completeness < 60%)
    if completeness_score < 60:
        if not structured_data.get('contact_info', {}).get('email'):
            recommendations.append({
                'category': 'Contact Information',
                'priority': 'critical',
                'suggestion': 'Add a professional email address - this is essential for employers to reach you'
            })
        
        if not structured_data.get('work_experience'):
            recommendations.append({
                'category': 'Experience',
                'priority': 'critical',
                'suggestion': 'Add your work experience with specific accomplishments and responsibilities'
            })
    
    # High priority improvements (completeness < 80%)
    if completeness_score < 80:
        if len(structured_data.get('skills', [])) < 5:
            recommendations.append({
                'category': 'Skills',
                'priority': 'high',
                'suggestion': 'Add more relevant skills including both technical and soft skills'
            })
        
        if not structured_data.get('professional_summary'):
            recommendations.append({
                'category': 'Summary',
                'priority': 'high',
                'suggestion': 'Add a compelling professional summary that highlights your key strengths'
            })
    
    # Medium priority improvements
    if not structured_data.get('contact_info', {}).get('linkedin_url'):
        recommendations.append({
            'category': 'Professional Presence',
            'priority': 'medium',
            'suggestion': 'Add your LinkedIn profile to provide additional professional context'
        })
    
    if not structured_data.get('certifications') and not structured_data.get('projects'):
        recommendations.append({
            'category': 'Additional Sections',
            'priority': 'medium',
            'suggestion': 'Consider adding certifications, projects, or other achievements to stand out'
        })
    
    return recommendations