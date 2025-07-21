import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { useToast } from "../components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Star,
  Users,
  MessageSquare,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Briefcase,
  User,
  ChevronRight,
  Play,
  FileText,
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Video,
  Phone,
  Mail,
  Globe,
  LinkedIn,
  UserCheck,
  Calendar as CalendarIcon,
  Clock as ClockIcon
} from "lucide-react";
import useAuthStore from "../stores/useAuthStore";

interface Advisor {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  experience: number;
  price: number;
  availability: string;
  bio: string;
  languages: string[];
  sessionTypes: string[];
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  publishedDate: string;
  author: string;
  views: number;
  likes: number;
  tags: string[];
  featured: boolean;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  completedBy: number;
  rating: number;
}

const AdvicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'coaching' | 'articles' | 'assessments' | 'industry'>('coaching');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);

  // Mock data for advisors
  const mockAdvisors: Advisor[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Senior Career Coach',
      company: 'Microsoft',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616c0763c4c?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      reviewCount: 127,
      specialties: ['Career Transitions', 'Leadership Development', 'Tech Industry'],
      experience: 8,
      price: 150,
      availability: 'Available this week',
      bio: 'Former Microsoft executive with 15+ years in tech. Specializes in helping professionals transition into leadership roles and navigate career changes in the technology sector.',
      languages: ['English', 'Spanish'],
      sessionTypes: ['Video Call', 'Phone', 'In-Person']
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Executive Coach',
      company: 'Goldman Sachs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
      reviewCount: 203,
      specialties: ['Executive Coaching', 'Finance Industry', 'Interview Prep'],
      experience: 12,
      price: 200,
      availability: 'Next available: Monday',
      bio: 'Senior partner at Goldman Sachs with extensive experience in finance and investment banking. Helps executives and senior professionals advance their careers.',
      languages: ['English', 'Mandarin'],
      sessionTypes: ['Video Call', 'Phone']
    },
    {
      id: '3',
      name: 'Lisa Wang',
      title: 'Startup Career Advisor',
      company: 'Y Combinator',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 4.7,
      reviewCount: 89,
      specialties: ['Startup Career Paths', 'Product Management', 'Entrepreneurship'],
      experience: 6,
      price: 120,
      availability: 'Available today',
      bio: 'Partner at Y Combinator and former VP of Product at multiple successful startups. Expert in startup career navigation and product management roles.',
      languages: ['English', 'Korean'],
      sessionTypes: ['Video Call', 'Phone', 'In-Person']
    }
  ];

  // Mock data for articles
  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'How to Navigate Career Transitions in Your 30s',
      excerpt: 'Practical strategies for making successful career changes while maintaining financial stability and work-life balance.',
      category: 'Career Change',
      readTime: 8,
      publishedDate: '2024-02-10',
      author: 'Sarah Johnson',
      views: 12453,
      likes: 987,
      tags: ['career change', 'career transition', '30s', 'planning'],
      featured: true
    },
    {
      id: '2',
      title: 'The Art of Salary Negotiation: A Step-by-Step Guide',
      excerpt: 'Master the psychology and tactics of successful salary negotiation with proven strategies from top negotiators.',
      category: 'Compensation',
      readTime: 12,
      publishedDate: '2024-02-08',
      author: 'Michael Chen',
      views: 18760,
      likes: 1543,
      tags: ['salary', 'negotiation', 'compensation', 'career advancement'],
      featured: true
    },
    {
      id: '3',
      title: 'Building Your Personal Brand on LinkedIn',
      excerpt: 'Learn how to create a compelling LinkedIn presence that attracts recruiters and showcases your expertise.',
      category: 'Personal Branding',
      readTime: 6,
      publishedDate: '2024-02-05',
      author: 'Lisa Wang',
      views: 9234,
      likes: 756,
      tags: ['LinkedIn', 'personal branding', 'networking', 'social media'],
      featured: false
    },
    {
      id: '4',
      title: 'Remote Work Leadership: Managing Distributed Teams',
      excerpt: 'Essential skills and strategies for leading remote teams effectively in the modern workplace.',
      category: 'Leadership',
      readTime: 10,
      publishedDate: '2024-02-03',
      author: 'David Rodriguez',
      views: 7892,
      likes: 623,
      tags: ['remote work', 'leadership', 'team management', 'digital leadership'],
      featured: false
    }
  ];

  // Mock data for assessments
  const mockAssessments: Assessment[] = [
    {
      id: '1',
      title: 'Career Readiness Assessment',
      description: 'Evaluate your current career status and identify areas for improvement and growth opportunities.',
      duration: 15,
      questions: 25,
      difficulty: 'beginner',
      category: 'General',
      completedBy: 15420,
      rating: 4.6
    },
    {
      id: '2',
      title: 'Leadership Style Assessment',
      description: 'Discover your natural leadership style and learn how to leverage your strengths in management roles.',
      duration: 20,
      questions: 30,
      difficulty: 'intermediate',
      category: 'Leadership',
      completedBy: 8930,
      rating: 4.8
    },
    {
      id: '3',
      title: 'Salary Negotiation Readiness',
      description: 'Test your knowledge and confidence level for upcoming salary negotiations and compensation discussions.',
      duration: 12,
      questions: 20,
      difficulty: 'intermediate',
      category: 'Compensation',
      completedBy: 6784,
      rating: 4.5
    },
    {
      id: '4',
      title: 'Tech Industry Fit Assessment',
      description: 'Determine if a career in technology aligns with your skills, interests, and career goals.',
      duration: 25,
      questions: 35,
      difficulty: 'beginner',
      category: 'Industry-Specific',
      completedBy: 12567,
      rating: 4.7
    }
  ];

  const specialties = [
    'All Specialties',
    'Career Transitions',
    'Leadership Development',
    'Interview Preparation',
    'Salary Negotiation',
    'Executive Coaching',
    'Startup Careers',
    'Personal Branding',
    'Work-Life Balance'
  ];

  const industries = [
    'All Industries',
    'Technology',
    'Finance',
    'Healthcare',
    'Marketing',
    'Consulting',
    'Retail',
    'Manufacturing',
    'Education',
    'Government'
  ];

  const handleBookConsultation = (advisorId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    toast({
      title: "Consultation Booking",
      description: "Redirecting to booking system...",
    });
    // In a real app, this would open a booking modal or redirect to a booking page
  };

  const handleTakeAssessment = (assessmentId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    toast({
      title: "Starting Assessment",
      description: "Loading assessment questions...",
    });
    // In a real app, this would navigate to the assessment page
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAdvisors = mockAdvisors.filter(advisor => {
    const matchesSearch = searchTerm === '' || 
      advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || selectedSpecialty === 'All Specialties' ||
      advisor.specialties.some(s => s.includes(selectedSpecialty));
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Career Advice & Coaching
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get personalized career guidance from industry experts, take professional assessments, 
            and access exclusive content to accelerate your career growth.
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'coaching', label: 'Expert Coaching', icon: Users },
                { id: 'articles', label: 'Advice Articles', icon: FileText },
                { id: 'assessments', label: 'Career Assessments', icon: Target },
                { id: 'industry', label: 'Industry Insights', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Expert Coaching Tab */}
        {activeTab === 'coaching' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search and Filters */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      placeholder="Search advisors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {industries.map(industry => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Advisors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdvisors.map((advisor) => (
                <motion.div
                  key={advisor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center">
                      <img
                        src={advisor.avatar}
                        alt={advisor.name}
                        className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                      />
                      <CardTitle className="text-lg">{advisor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{advisor.title}</p>
                      <p className="text-sm text-blue-600">{advisor.company}</p>
                      
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium ml-1">{advisor.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({advisor.reviewCount} reviews)</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {advisor.specialties.slice(0, 3).map(specialty => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {advisor.experience} years exp.
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${advisor.price}/session
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-3">
                        {advisor.bio}
                      </p>

                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-green-600 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          {advisor.availability}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {advisor.sessionTypes.map(type => (
                            <span key={type} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedAdvisor(advisor.id)}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleBookConsultation(advisor.id)}
                        >
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Book Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Advice Articles Tab */}
        {activeTab === 'articles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Featured Articles */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Articles</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {mockArticles.filter(article => article.featured).map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{article.category}</Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {article.readTime} min read
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {article.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <span>By {article.author}</span>
                          <span>{formatDate(article.publishedDate)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{article.views.toLocaleString()} views</span>
                          <span>{article.likes} likes</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Button className="w-full">
                        Read Article
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Articles */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Articles</h2>
              <div className="space-y-4">
                {mockArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">{article.category}</Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {article.readTime} min read
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <span>By {article.author}</span>
                              <span>{formatDate(article.publishedDate)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span>{article.views.toLocaleString()} views</span>
                              <span>{article.likes} likes</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm" className="ml-4">
                          Read
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Career Assessments Tab */}
        {activeTab === 'assessments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockAssessments.map((assessment) => (
                <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getDifficultyColor(assessment.difficulty)}>
                        {assessment.difficulty}
                      </Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium ml-1">{assessment.rating}</span>
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    <p className="text-gray-600 text-sm">{assessment.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <ClockIcon className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                        <p className="text-sm font-medium">{assessment.duration} min</p>
                        <p className="text-xs text-gray-500">Duration</p>
                      </div>
                      <div>
                        <MessageSquare className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                        <p className="text-sm font-medium">{assessment.questions}</p>
                        <p className="text-xs text-gray-500">Questions</p>
                      </div>
                      <div>
                        <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                        <p className="text-sm font-medium">{assessment.completedBy.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => handleTakeAssessment(assessment.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Assessment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Industry Insights Tab */}
        {activeTab === 'industry' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.slice(1).map((industry) => (
                <Card key={industry} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{industry}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Get insights, salary trends, and career guidance specific to {industry.toLowerCase()}.
                    </p>
                    <Button variant="outline" size="sm">
                      Explore {industry}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of professionals who have transformed their careers with expert guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              <Users className="h-5 w-5 mr-2" />
              Book a Consultation
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
              <Target className="h-5 w-5 mr-2" />
              Take Assessment
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvicePage;