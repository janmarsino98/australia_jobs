from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import re


class UserRole(str, Enum):
    """User role enumeration"""
    JOB_SEEKER = "job_seeker"
    EMPLOYER = "employer"
    ADMIN = "admin"


class OAuthProvider(str, Enum):
    """OAuth provider enumeration"""
    GOOGLE = "google"
    LINKEDIN = "linkedin"


class OAuthAccount(BaseModel):
    """OAuth account information for a specific provider"""
    provider_id: str = Field(..., description="Unique ID from the OAuth provider")
    connected_at: datetime = Field(..., description="When this OAuth account was connected")
    last_used: Optional[datetime] = Field(None, description="When this OAuth account was last used for login")
    profile_data: Optional[Dict[str, Any]] = Field(None, description="Additional profile data from the provider")
    
    class Config:
        # Allow arbitrary types for MongoDB ObjectId compatibility
        arbitrary_types_allowed = True
        # Use enum values in JSON
        use_enum_values = True


class UserProfile(BaseModel):
    """Extended user profile information"""
    first_name: Optional[str] = Field(None, max_length=100, description="User's first name")
    last_name: Optional[str] = Field(None, max_length=100, description="User's last name")
    display_name: Optional[str] = Field(None, max_length=200, description="User's preferred display name")
    profile_picture: Optional[str] = Field(None, description="URL to user's profile picture")
    bio: Optional[str] = Field(None, max_length=1000, description="User's biography")
    phone: Optional[str] = Field(None, max_length=20, description="User's phone number")
    location: Optional[str] = Field(None, max_length=200, description="User's location")
    website: Optional[str] = Field(None, description="User's website URL")
    linkedin_profile: Optional[str] = Field(None, description="LinkedIn profile URL")
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v
    
    @validator('website', 'linkedin_profile')
    def validate_url(cls, v):
        if v and not re.match(r'^https?://', v):
            raise ValueError('URL must start with http:// or https://')
        return v


class UserPreferences(BaseModel):
    """User preferences and settings"""
    email_notifications: bool = Field(True, description="Receive email notifications")
    sms_notifications: bool = Field(False, description="Receive SMS notifications")
    newsletter_subscription: bool = Field(True, description="Subscribe to newsletter")
    job_alerts: bool = Field(True, description="Receive job alerts")
    privacy_settings: Dict[str, bool] = Field(
        default_factory=lambda: {
            "profile_visible": True,
            "contact_info_visible": False,
            "activity_visible": True
        },
        description="Privacy settings"
    )
    preferred_language: str = Field("en", description="Preferred language code")
    timezone: Optional[str] = Field(None, description="User's timezone")


class User(BaseModel):
    """Main user model for the database"""
    # Core identification
    email: EmailStr = Field(..., description="User's email address")
    name: str = Field(..., min_length=1, max_length=200, description="User's full name")
    role: UserRole = Field(UserRole.JOB_SEEKER, description="User's role in the system")
    
    # Authentication
    password: Optional[str] = Field(None, description="Hashed password for regular auth")
    email_verified: bool = Field(False, description="Whether email is verified")
    email_placeholder: bool = Field(False, description="Whether email is a placeholder for OAuth users")
    
    # Extended profile
    profile: UserProfile = Field(default_factory=UserProfile, description="Extended profile information")
    preferences: UserPreferences = Field(default_factory=UserPreferences, description="User preferences")
    
    # OAuth accounts
    oauth_accounts: Dict[OAuthProvider, OAuthAccount] = Field(
        default_factory=dict, 
        description="Connected OAuth accounts"
    )
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When user was created")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="When user was last updated")
    last_login: Optional[datetime] = Field(None, description="When user last logged in")
    
    # Status
    is_active: bool = Field(True, description="Whether user account is active")
    is_verified: bool = Field(False, description="Whether user profile is verified")
    
    # Resume service tokens
    resume_tokens: int = Field(1, description="Available free AI resume review tokens")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        # Remove extra whitespace
        return ' '.join(v.split())
    
    @validator('oauth_accounts', pre=True)
    def validate_oauth_accounts(cls, v):
        if isinstance(v, dict):
            # Convert string keys to enum values if needed
            converted = {}
            for key, value in v.items():
                if isinstance(key, str):
                    try:
                        enum_key = OAuthProvider(key)
                        converted[enum_key] = value
                    except ValueError:
                        # Skip invalid providers
                        continue
                else:
                    converted[key] = value
            return converted
        return v
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow()
    
    def add_oauth_account(self, provider: OAuthProvider, provider_id: str, profile_data: Optional[Dict] = None):
        """Add or update an OAuth account"""
        self.oauth_accounts[provider] = OAuthAccount(
            provider_id=provider_id,
            connected_at=datetime.utcnow(),
            last_used=datetime.utcnow(),
            profile_data=profile_data
        )
        self.update_timestamp()
    
    def update_profile_from_oauth(self, provider: OAuthProvider, oauth_data: Dict[str, Any]):
        """Update user profile from OAuth provider data"""
        if provider == OAuthProvider.LINKEDIN:
            # Update LinkedIn-specific data
            if oauth_data.get('given_name'):
                self.profile.first_name = oauth_data['given_name']
            if oauth_data.get('family_name'):
                self.profile.last_name = oauth_data['family_name']
            if oauth_data.get('picture'):
                self.profile.profile_picture = oauth_data['picture']
            if oauth_data.get('name') and not self.profile.display_name:
                self.profile.display_name = oauth_data['name']
                
        elif provider == OAuthProvider.GOOGLE:
            # Update Google-specific data
            if oauth_data.get('given_name'):
                self.profile.first_name = oauth_data['given_name']
            if oauth_data.get('family_name'):
                self.profile.last_name = oauth_data['family_name']
            if oauth_data.get('picture'):
                self.profile.profile_picture = oauth_data['picture']
            if oauth_data.get('name') and not self.profile.display_name:
                self.profile.display_name = oauth_data['name']
        
        # Update full name if we have first and last names
        if self.profile.first_name and self.profile.last_name:
            self.name = f"{self.profile.first_name} {self.profile.last_name}"
        elif oauth_data.get('name'):
            self.name = oauth_data['name']
        
        self.update_timestamp()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for MongoDB storage"""
        data = self.dict(by_alias=True)
        
        # Convert enum keys to strings for MongoDB
        if 'oauth_accounts' in data:
            oauth_accounts_str_keys = {}
            for provider, account in data['oauth_accounts'].items():
                if hasattr(provider, 'value'):
                    oauth_accounts_str_keys[provider.value] = account
                else:
                    oauth_accounts_str_keys[str(provider)] = account
            data['oauth_accounts'] = oauth_accounts_str_keys
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create User instance from MongoDB document"""
        # Convert string keys back to enums for oauth_accounts
        if 'oauth_accounts' in data and isinstance(data['oauth_accounts'], dict):
            oauth_accounts_enum_keys = {}
            for provider_str, account in data['oauth_accounts'].items():
                try:
                    provider_enum = OAuthProvider(provider_str)
                    oauth_accounts_enum_keys[provider_enum] = account
                except ValueError:
                    # Skip invalid providers
                    continue
            data['oauth_accounts'] = oauth_accounts_enum_keys
        
        return cls(**data)
    
    class Config:
        # Allow arbitrary types for MongoDB ObjectId compatibility
        arbitrary_types_allowed = True
        # Use enum values in JSON serialization
        use_enum_values = True
        # Allow population by field name or alias
        allow_population_by_field_name = True


class UserUpdate(BaseModel):
    """Model for user updates (partial updates allowed)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    profile: Optional[UserProfile] = None
    preferences: Optional[UserPreferences] = None
    is_active: Optional[bool] = None
    
    class Config:
        arbitrary_types_allowed = True
        use_enum_values = True


class UserResponse(BaseModel):
    """Model for API responses containing user data"""
    id: str = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    name: str = Field(..., description="User's full name")
    role: UserRole = Field(..., description="User's role")
    email_verified: bool = Field(..., description="Email verification status")
    profile: UserProfile = Field(..., description="User profile information")
    oauth_accounts: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Connected OAuth accounts")
    created_at: datetime = Field(..., description="Account creation date")
    last_login: Optional[datetime] = Field(None, description="Last login date")
    is_active: bool = Field(..., description="Account status")
    
    class Config:
        use_enum_values = True


# Email verification and password reset token models
class TokenType(str, Enum):
    """Token type enumeration"""
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


class Token(BaseModel):
    """Token model for email verification and password reset"""
    token: str = Field(..., description="The actual token string")
    email: EmailStr = Field(..., description="Associated email address")
    token_type: TokenType = Field(..., description="Type of token")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When token was created")
    expires_at: datetime = Field(..., description="When token expires")
    used: bool = Field(False, description="Whether token has been used")
    used_at: Optional[datetime] = Field(None, description="When token was used")
    
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        return not self.used and not self.is_expired()
    
    def mark_as_used(self):
        """Mark token as used"""
        self.used = True
        self.used_at = datetime.utcnow()
    
    class Config:
        use_enum_values = True 