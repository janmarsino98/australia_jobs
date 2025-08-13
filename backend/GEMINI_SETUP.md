# Gemini AI Integration Setup

The resume parser now uses Google's Gemini 2.5 Flash model for intelligent resume parsing and analysis.

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key" and create a new API key
4. Copy the API key

### 2. Configure Environment
Add the API key to your environment variables or `.env` file:

```bash
# Add to your .env file in the backend directory
GEMINI_API_KEY=your_api_key_here
```

### 3. Install Dependencies
Install the required Python package:

```bash
pip install google-generativeai==0.8.3
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

## Features

### Enhanced Resume Parsing
- **Contact Information**: Intelligent extraction of names, emails, phone numbers, LinkedIn profiles
- **Work Experience**: Detailed job history with dates, companies, and descriptions
- **Education**: Degree information, institutions, and graduation years
- **Skills & Certifications**: Comprehensive skill identification
- **Projects**: Project extraction with technologies used

### AI-Powered Analysis
- **Completeness Scoring**: Intelligent evaluation of resume completeness
- **ATS Compatibility**: Analysis for Applicant Tracking System optimization
- **Recommendations**: Specific suggestions for improvement
- **Australian Context**: Optimized for Australian job market requirements

## Fallback Behavior

If the Gemini API key is not configured or the service is unavailable, the system automatically falls back to regex-based parsing to ensure continued functionality.

## API Usage Limits

- Gemini 2.5 Flash has generous free tier limits
- Monitor usage in Google AI Studio dashboard
- Consider rate limiting for production use

## Security Notes

- Keep your API key secure and never commit it to version control
- Use environment variables for API key storage
- Consider using Google Cloud IAM for production deployments