"""
AI-Powered Resume Analysis System
Integrates with OpenAI GPT and Anthropic Claude APIs for intelligent resume analysis
"""
import os
import openai
import requests
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from extensions import mongo
from flask_pymongo import ObjectId

# Database collections
ai_analysis_db = mongo.db.ai_resume_analysis
job_descriptions_db = mongo.db.job_descriptions

# API Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
openai.api_key = OPENAI_API_KEY

class AIAnalysisError(Exception):
    """AI analysis error"""
    pass

def analyze_resume_with_openai(resume_text: str, job_description: str = None) -> Dict:
    """
    Analyze resume using OpenAI GPT API
    
    Args:
        resume_text: Extracted resume text
        job_description: Optional job description for targeted analysis
    
    Returns:
        Dictionary with AI analysis results
    """
    try:
        if not OPENAI_API_KEY:
            raise AIAnalysisError("OpenAI API key not configured")
        
        # Construct prompt
        base_prompt = f"""
        Please analyze the following resume and provide a comprehensive assessment:

        Resume:
        {resume_text}

        Please provide analysis in the following JSON format:
        {{
            "overall_score": <score from 1-100>,
            "strengths": ["strength1", "strength2", "strength3"],
            "weaknesses": ["weakness1", "weakness2", "weakness3"],
            "improvements": [
                {{
                    "category": "category_name",
                    "suggestion": "specific suggestion",
                    "priority": "high|medium|low"
                }}
            ],
            "skills_assessment": {{
                "technical_skills": ["skill1", "skill2"],
                "soft_skills": ["skill1", "skill2"],
                "missing_skills": ["skill1", "skill2"]
            }},
            "experience_analysis": {{
                "years_experience": <estimated_years>,
                "career_progression": "excellent|good|fair|poor",
                "industry_focus": "primary industry"
            }},
            "ats_compatibility": {{
                "score": <score from 1-100>,
                "issues": ["issue1", "issue2"],
                "recommendations": ["rec1", "rec2"]
            }},
            "formatting_feedback": {{
                "clarity": <score from 1-10>,
                "structure": <score from 1-10>,
                "readability": <score from 1-10>
            }}
        }}
        """
        
        if job_description:
            base_prompt += f"""
            
            Job Description for targeted analysis:
            {job_description}
            
            Additionally, please include:
            {{
                "job_match_analysis": {{
                    "overall_match": <score from 1-100>,
                    "matching_skills": ["skill1", "skill2"],
                    "missing_requirements": ["req1", "req2"],
                    "transferable_experience": ["exp1", "exp2"],
                    "customization_suggestions": ["suggestion1", "suggestion2"]
                }}
            }}
            """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-16k",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert resume reviewer and career coach with 10+ years of experience in hiring and recruitment. Provide detailed, actionable feedback."
                },
                {
                    "role": "user",
                    "content": base_prompt
                }
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        # Parse the JSON response
        analysis_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from the response
        try:
            # Look for JSON in the response
            start_idx = analysis_text.find('{')
            end_idx = analysis_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = analysis_text[start_idx:end_idx]
                analysis = json.loads(json_str)
            else:
                # Fallback: treat entire response as text
                analysis = {
                    "overall_score": 75,
                    "analysis_text": analysis_text,
                    "error": "Could not parse structured response"
                }
        except json.JSONDecodeError:
            analysis = {
                "overall_score": 75,
                "analysis_text": analysis_text,
                "error": "JSON parsing failed"
            }
        
        # Add metadata
        analysis["ai_provider"] = "openai"
        analysis["model"] = "gpt-3.5-turbo-16k"
        analysis["analyzed_at"] = datetime.utcnow().isoformat()
        
        return analysis
        
    except Exception as e:
        print(f"Error in OpenAI analysis: {e}")
        raise AIAnalysisError(f"OpenAI analysis failed: {str(e)}")

def analyze_resume_with_claude(resume_text: str, job_description: str = None) -> Dict:
    """
    Analyze resume using Anthropic Claude API
    
    Args:
        resume_text: Extracted resume text
        job_description: Optional job description for targeted analysis
    
    Returns:
        Dictionary with AI analysis results
    """
    try:
        if not ANTHROPIC_API_KEY:
            raise AIAnalysisError("Anthropic API key not configured")
        
        # Construct prompt for Claude
        prompt = f"""
        Human: I need you to analyze a resume and provide comprehensive feedback. Please be thorough and constructive.

        Resume to analyze:
        {resume_text}
        """
        
        if job_description:
            prompt += f"""
            
            Job description for targeted analysis:
            {job_description}
            
            Please include job match analysis in your response.
            """
        
        prompt += """
        
        Please provide your analysis in this JSON structure:
        {
            "overall_score": <1-100>,
            "summary": "brief overall assessment",
            "strengths": ["list of key strengths"],
            "areas_for_improvement": ["list of improvement areas"],
            "detailed_feedback": {
                "content": "feedback on content and substance",
                "format": "feedback on formatting and presentation",
                "ats_optimization": "feedback on ATS compatibility"
            },
            "recommendations": [
                {
                    "category": "category name",
                    "suggestion": "specific actionable suggestion",
                    "impact": "high|medium|low"
                }
            ]
        }

        Assistant: I'll analyze this resume comprehensively and provide detailed feedback.

        """
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }
        
        data = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": 4000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code != 200:
            raise AIAnalysisError(f"Claude API error: {response.status_code} - {response.text}")
        
        result = response.json()
        analysis_text = result["content"][0]["text"]
        
        # Try to parse JSON from Claude's response
        try:
            start_idx = analysis_text.find('{')
            end_idx = analysis_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = analysis_text[start_idx:end_idx]
                analysis = json.loads(json_str)
            else:
                analysis = {
                    "overall_score": 75,
                    "analysis_text": analysis_text,
                    "error": "Could not parse structured response"
                }
        except json.JSONDecodeError:
            analysis = {
                "overall_score": 75,
                "analysis_text": analysis_text,
                "error": "JSON parsing failed"
            }
        
        # Add metadata
        analysis["ai_provider"] = "anthropic"
        analysis["model"] = "claude-3-sonnet"
        analysis["analyzed_at"] = datetime.utcnow().isoformat()
        
        return analysis
        
    except Exception as e:
        print(f"Error in Claude analysis: {e}")
        raise AIAnalysisError(f"Claude analysis failed: {str(e)}")

def calculate_ats_score(resume_text: str, parsed_data: Dict) -> Dict:
    """
    Calculate ATS (Applicant Tracking System) compatibility score
    
    Args:
        resume_text: Resume text
        parsed_data: Parsed resume data
    
    Returns:
        Dictionary with ATS score and recommendations
    """
    try:
        ats_score = 0
        total_points = 100
        issues = []
        recommendations = []
        
        # Check for contact information (20 points)
        contact_info = parsed_data.get('contact_info', {})
        contact_score = 0
        
        if contact_info.get('emails'):
            contact_score += 10
        else:
            issues.append("Missing email address")
            recommendations.append("Add a professional email address at the top")
        
        if contact_info.get('phones'):
            contact_score += 5
        else:
            issues.append("Missing phone number")
            recommendations.append("Add a contact phone number")
        
        if contact_info.get('linkedin_urls'):
            contact_score += 5
        else:
            recommendations.append("Add LinkedIn profile URL")
        
        ats_score += contact_score
        
        # Check for standard sections (30 points)
        sections_score = 0
        
        if parsed_data.get('work_experience'):
            sections_score += 15
        else:
            issues.append("Missing work experience section")
            recommendations.append("Add detailed work experience")
        
        if parsed_data.get('education'):
            sections_score += 10
        else:
            issues.append("Missing education section")
            recommendations.append("Add education background")
        
        if parsed_data.get('skills'):
            sections_score += 5
        else:
            issues.append("Missing skills section")
            recommendations.append("Add relevant skills section")
        
        ats_score += sections_score
        
        # Check for keyword optimization (20 points)
        keyword_score = 0
        skill_count = len(parsed_data.get('skills', []))
        
        if skill_count >= 10:
            keyword_score += 20
        elif skill_count >= 5:
            keyword_score += 15
        elif skill_count >= 1:
            keyword_score += 10
        else:
            issues.append("Insufficient keywords/skills")
            recommendations.append("Add more relevant industry keywords and skills")
        
        ats_score += keyword_score
        
        # Check for formatting issues (15 points)
        format_score = 15  # Start with full points
        text_lower = resume_text.lower()
        
        # Check for problematic elements
        if any(char in resume_text for char in ['•', '◦', '▪']):
            format_score -= 2
            recommendations.append("Replace special bullet characters with standard dashes or asterisks")
        
        if len(resume_text.split('\n')) < 10:
            format_score -= 3
            issues.append("Resume appears too short or poorly formatted")
            recommendations.append("Ensure proper line breaks and section separation")
        
        # Check for tables or complex formatting indicators
        if 'table' in text_lower or '\t' in resume_text:
            format_score -= 2
            recommendations.append("Avoid tables and complex formatting that ATS systems can't parse")
        
        ats_score += max(0, format_score)
        
        # Check for length appropriateness (15 points)
        length_score = 0
        word_count = len(resume_text.split())
        
        if 300 <= word_count <= 800:  # Optimal length
            length_score = 15
        elif 200 <= word_count < 300 or 800 < word_count <= 1200:
            length_score = 12
        elif word_count < 200:
            length_score = 5
            issues.append("Resume is too short")
            recommendations.append("Add more detail to your experience and achievements")
        else:
            length_score = 8
            issues.append("Resume may be too long")
            recommendations.append("Consider condensing to 1-2 pages for better ATS processing")
        
        ats_score += length_score
        
        # Determine rating
        if ats_score >= 90:
            rating = "Excellent"
        elif ats_score >= 75:
            rating = "Good"
        elif ats_score >= 60:
            rating = "Fair"
        else:
            rating = "Poor"
        
        return {
            "ats_score": min(ats_score, total_points),
            "rating": rating,
            "issues": issues,
            "recommendations": recommendations,
            "breakdown": {
                "contact_info": contact_score,
                "sections": sections_score,
                "keywords": keyword_score,
                "formatting": max(0, format_score),
                "length": length_score
            }
        }
        
    except Exception as e:
        print(f"Error calculating ATS score: {e}")
        return {
            "ats_score": 0,
            "rating": "Error",
            "error": str(e)
        }

def match_resume_to_job(resume_text: str, job_description: str, parsed_data: Dict) -> Dict:
    """
    Match resume to specific job description
    
    Args:
        resume_text: Resume text
        job_description: Job description text
        parsed_data: Parsed resume data
    
    Returns:
        Dictionary with job match analysis
    """
    try:
        # Extract keywords from job description
        job_keywords = extract_job_keywords(job_description)
        resume_skills = [skill.lower() for skill in parsed_data.get('skills', [])]
        
        # Calculate keyword match
        matching_keywords = []
        missing_keywords = []
        
        for keyword in job_keywords:
            if any(keyword.lower() in skill for skill in resume_skills) or keyword.lower() in resume_text.lower():
                matching_keywords.append(keyword)
            else:
                missing_keywords.append(keyword)
        
        # Calculate match percentage
        total_keywords = len(job_keywords)
        matched_keywords = len(matching_keywords)
        match_percentage = (matched_keywords / total_keywords * 100) if total_keywords > 0 else 0
        
        # Generate suggestions
        suggestions = []
        if missing_keywords:
            suggestions.append(f"Consider adding these relevant skills: {', '.join(missing_keywords[:5])}")
        
        if match_percentage < 50:
            suggestions.append("Tailor your resume more closely to this job description")
            suggestions.append("Highlight experience that directly relates to the job requirements")
        
        return {
            "match_percentage": round(match_percentage, 1),
            "matching_keywords": matching_keywords,
            "missing_keywords": missing_keywords,
            "total_job_keywords": total_keywords,
            "suggestions": suggestions
        }
        
    except Exception as e:
        print(f"Error matching resume to job: {e}")
        return {
            "match_percentage": 0,
            "error": str(e)
        }

def extract_job_keywords(job_description: str) -> List[str]:
    """Extract important keywords from job description"""
    
    # Common technical and business keywords
    important_keywords = [
        'python', 'java', 'javascript', 'react', 'nodejs', 'html', 'css', 'sql',
        'aws', 'azure', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
        'project management', 'leadership', 'communication', 'teamwork',
        'analysis', 'problem solving', 'customer service', 'sales', 'marketing'
    ]
    
    job_lower = job_description.lower()
    found_keywords = []
    
    for keyword in important_keywords:
        if keyword in job_lower:
            found_keywords.append(keyword)
    
    # Extract degree requirements
    degree_patterns = ['bachelor', 'master', 'phd', 'degree', 'diploma']
    for pattern in degree_patterns:
        if pattern in job_lower:
            found_keywords.append(pattern)
    
    return found_keywords

def save_ai_analysis(user_id: str, analysis_data: Dict) -> str:
    """
    Save AI analysis results to database
    
    Args:
        user_id: User ID
        analysis_data: AI analysis results
    
    Returns:
        Analysis ID
    """
    try:
        analysis_doc = {
            'user_id': ObjectId(user_id),
            'analysis_data': analysis_data,
            'created_at': datetime.utcnow(),
            'analysis_type': 'ai_powered'
        }
        
        result = ai_analysis_db.insert_one(analysis_doc)
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error saving AI analysis: {e}")
        raise AIAnalysisError("Failed to save AI analysis results")

def get_ai_analysis(user_id: str, analysis_id: str = None) -> Optional[Dict]:
    """
    Get AI analysis from database
    
    Args:
        user_id: User ID
        analysis_id: Optional specific analysis ID
    
    Returns:
        AI analysis data or None
    """
    try:
        query = {'user_id': ObjectId(user_id)}
        if analysis_id:
            query['_id'] = ObjectId(analysis_id)
        
        analysis = ai_analysis_db.find_one(
            query,
            sort=[('created_at', -1)]
        )
        
        if analysis:
            analysis['_id'] = str(analysis['_id'])
            analysis['user_id'] = str(analysis['user_id'])
            return analysis
        
        return None
        
    except Exception as e:
        print(f"Error getting AI analysis: {e}")
        return None

def generate_resume_improvements(parsed_data: Dict, ats_analysis: Dict) -> List[Dict]:
    """
    Generate specific resume improvement suggestions
    
    Args:
        parsed_data: Parsed resume data
        ats_analysis: ATS analysis results
    
    Returns:
        List of improvement suggestions
    """
    improvements = []
    
    # Contact info improvements
    contact_info = parsed_data.get('contact_info', {})
    if not contact_info.get('emails'):
        improvements.append({
            "category": "Contact Information",
            "suggestion": "Add a professional email address at the top of your resume",
            "priority": "high",
            "impact": "Essential for employers to contact you"
        })
    
    if not contact_info.get('linkedin_urls'):
        improvements.append({
            "category": "Contact Information", 
            "suggestion": "Add your LinkedIn profile URL",
            "priority": "medium",
            "impact": "Provides additional professional context"
        })
    
    # Skills improvements
    skills = parsed_data.get('skills', [])
    if len(skills) < 5:
        improvements.append({
            "category": "Skills",
            "suggestion": "Add more relevant technical and soft skills",
            "priority": "high",
            "impact": "Improves keyword matching and ATS score"
        })
    
    # Experience improvements
    experience = parsed_data.get('work_experience', [])
    if len(experience) < 2:
        improvements.append({
            "category": "Experience",
            "suggestion": "Add more detailed work experience with specific achievements",
            "priority": "high",
            "impact": "Demonstrates career progression and impact"
        })
    
    # ATS-specific improvements
    if ats_analysis.get('ats_score', 0) < 75:
        improvements.extend([
            {
                "category": "ATS Optimization",
                "suggestion": "Use standard section headers like 'Work Experience', 'Education', 'Skills'",
                "priority": "medium",
                "impact": "Improves ATS parsing accuracy"
            },
            {
                "category": "ATS Optimization",
                "suggestion": "Include more industry-specific keywords throughout your resume",
                "priority": "high", 
                "impact": "Increases visibility in keyword searches"
            }
        ])
    
    return improvements