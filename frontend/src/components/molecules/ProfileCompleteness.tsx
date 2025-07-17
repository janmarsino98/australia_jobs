import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { User, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { User as UserType } from "../../types/store";

interface ProfileCompletenessProps {
    user: UserType | null;
    onActionClick?: (action: string) => void;
    className?: string;
}

interface ProfileSection {
    id: string;
    label: string;
    weight: number;
    isComplete: boolean;
    action?: string;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ 
    user, 
    onActionClick,
    className = "" 
}) => {
    if (!user) {
        return null;
    }

    const calculateProfileSections = (user: UserType): ProfileSection[] => {
        return [
            {
                id: 'basic-info',
                label: 'Basic Information',
                weight: 20,
                isComplete: !!(user.name && user.email),
                action: 'edit-profile'
            },
            {
                id: 'contact',
                label: 'Contact Details',
                weight: 10,
                isComplete: !!(user.phone),
                action: 'add-contact'
            },
            {
                id: 'bio',
                label: 'Professional Summary',
                weight: 15,
                isComplete: !!(user.bio && user.bio.length > 50),
                action: 'add-bio'
            },
            {
                id: 'location',
                label: 'Location',
                weight: 10,
                isComplete: !!(user.location?.city && user.location?.state),
                action: 'add-location'
            },
            {
                id: 'experience',
                label: 'Work Experience',
                weight: 20,
                isComplete: !!(user.experience),
                action: 'add-experience'
            },
            {
                id: 'education',
                label: 'Education',
                weight: 10,
                isComplete: !!(user.education),
                action: 'add-education'
            },
            {
                id: 'skills',
                label: 'Skills',
                weight: 10,
                isComplete: !!(user.skills && user.skills.length >= 3),
                action: 'add-skills'
            },
            {
                id: 'resume',
                label: 'Resume',
                weight: 20,
                isComplete: !!(user.resumeUploaded),
                action: 'upload-resume'
            },
            {
                id: 'preferences',
                label: 'Job Preferences',
                weight: 10,
                isComplete: !!(user.preferences?.jobTypes && user.preferences.jobTypes.length > 0),
                action: 'set-preferences'
            },
            {
                id: 'social-links',
                label: 'Professional Links',
                weight: 5,
                isComplete: !!(user.linkedin || user.github || user.website),
                action: 'add-links'
            }
        ];
    };

    const sections = calculateProfileSections(user);
    const completedSections = sections.filter(section => section.isComplete);
    const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
    const completedWeight = completedSections.reduce((sum, section) => sum + section.weight, 0);
    const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

    const getCompletionColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getCompletionMessage = (percentage: number) => {
        if (percentage >= 90) return 'Excellent! Your profile is almost complete.';
        if (percentage >= 70) return 'Good progress! A few more details will make your profile shine.';
        if (percentage >= 50) return 'You\'re halfway there! Keep building your profile.';
        return 'Let\'s get started! Complete your profile to attract employers.';
    };

    const incompleteSections = sections.filter(section => !section.isComplete).slice(0, 3);

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Completeness
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Complete</span>
                        <span className={`text-sm font-bold ${getCompletionColor(completionPercentage)}`}>
                            {completionPercentage}%
                        </span>
                    </div>
                    <Progress value={completionPercentage} className="h-3" />
                    <p className="text-xs text-gray-600">
                        {getCompletionMessage(completionPercentage)}
                    </p>
                </div>

                {/* Completed Sections */}
                {completedSections.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Completed</h4>
                        <div className="space-y-1">
                            {completedSections.slice(0, 3).map((section) => (
                                <div key={section.id} className="flex items-center text-xs text-gray-600">
                                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                                    {section.label}
                                </div>
                            ))}
                            {completedSections.length > 3 && (
                                <div className="text-xs text-gray-500">
                                    +{completedSections.length - 3} more completed
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Items */}
                {incompleteSections.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Next Steps</h4>
                        <div className="space-y-2">
                            {incompleteSections.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => onActionClick?.(section.action || 'edit-profile')}
                                    className="flex items-center justify-between w-full p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-2 text-blue-500" />
                                        <span className="text-gray-700">Add {section.label}</span>
                                    </div>
                                    <Plus className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Perfect Profile Message */}
                {completionPercentage === 100 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            <span className="text-sm font-medium text-green-800">
                                Perfect! Your profile is complete and ready to impress employers.
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProfileCompleteness; 