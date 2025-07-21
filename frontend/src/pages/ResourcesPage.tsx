import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { useToast } from "../components/ui/use-toast";
import { motion } from "framer-motion";
import { 
  BookOpen,
  FileText,
  Users,
  Target,
  Download,
  Search,
  Filter,
  Clock,
  Star,
  Eye,
  Bookmark,
  TrendingUp,
  Award,
  Lightbulb,
  MessageSquare,
  PlayCircle,
  FileDown
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'guide' | 'template' | 'video' | 'checklist';
  readTime?: number;
  downloadUrl?: string;
  isBookmarked: boolean;
  views: number;
  rating: number;
  tags: string[];
  publishedDate: string;
  author?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const ResourcesPage = () => {
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  // Categories and types
  const categories = [
    { id: "all", name: "All Categories", icon: BookOpen },
    { id: "career-advice", name: "Career Advice", icon: TrendingUp },
    { id: "resume-writing", name: "Resume Writing", icon: FileText },
    { id: "interview-prep", name: "Interview Preparation", icon: MessageSquare },
    { id: "job-search", name: "Job Search", icon: Search },
    { id: "networking", name: "Networking", icon: Users },
    { id: "skill-development", name: "Skill Development", icon: Award },
    { id: "workplace-tips", name: "Workplace Tips", icon: Lightbulb }
  ];

  const resourceTypes = [
    { id: "all", name: "All Types" },
    { id: "article", name: "Articles" },
    { id: "guide", name: "Guides" },
    { id: "template", name: "Templates" },
    { id: "video", name: "Videos" },
    { id: "checklist", name: "Checklists" }
  ];

  // Mock data - would be replaced with API call
  const mockResources: Resource[] = [
    {
      id: "1",
      title: "Complete Guide to Writing a Professional Resume",
      description: "A comprehensive guide covering everything from formatting to content, with real examples and templates.",
      category: "resume-writing",
      type: "guide",
      readTime: 15,
      isBookmarked: false,
      views: 12543,
      rating: 4.8,
      tags: ["resume", "formatting", "templates", "examples"],
      publishedDate: "2024-01-15",
      author: "Sarah Johnson, HR Expert",
      difficulty: "beginner",
      downloadUrl: "/downloads/resume-guide.pdf"
    },
    {
      id: "2",
      title: "Modern Resume Template - ATS Friendly",
      description: "Clean, professional resume template designed to pass ATS systems while looking great to human recruiters.",
      category: "resume-writing",
      type: "template",
      isBookmarked: true,
      views: 8921,
      rating: 4.9,
      tags: ["template", "ATS", "modern", "professional"],
      publishedDate: "2024-01-20",
      difficulty: "beginner",
      downloadUrl: "/downloads/modern-resume-template.docx"
    },
    {
      id: "3",
      title: "Mastering the STAR Method for Interview Success",
      description: "Learn how to structure your interview answers using the Situation, Task, Action, Result framework.",
      category: "interview-prep",
      type: "article",
      readTime: 8,
      isBookmarked: false,
      views: 15670,
      rating: 4.7,
      tags: ["STAR method", "interviews", "behavioral questions", "storytelling"],
      publishedDate: "2024-01-10",
      author: "Michael Chen, Career Coach",
      difficulty: "intermediate"
    },
    {
      id: "4",
      title: "50 Most Common Interview Questions & Best Answers",
      description: "Comprehensive list of frequently asked interview questions with example answers and tips.",
      category: "interview-prep",
      type: "guide",
      readTime: 25,
      isBookmarked: false,
      views: 23456,
      rating: 4.6,
      tags: ["interview questions", "answers", "preparation", "examples"],
      publishedDate: "2024-01-05",
      author: "Lisa Wang, Recruitment Specialist",
      difficulty: "beginner",
      downloadUrl: "/downloads/interview-questions-guide.pdf"
    },
    {
      id: "5",
      title: "Building Your Professional Network on LinkedIn",
      description: "Step-by-step strategies for growing your professional network and leveraging LinkedIn for career opportunities.",
      category: "networking",
      type: "video",
      readTime: 12,
      isBookmarked: true,
      views: 9834,
      rating: 4.5,
      tags: ["LinkedIn", "networking", "social media", "connections"],
      publishedDate: "2024-01-25",
      author: "David Rodriguez, LinkedIn Expert",
      difficulty: "intermediate"
    },
    {
      id: "6",
      title: "Job Search Checklist - Never Miss a Step",
      description: "Complete checklist to ensure you're covering all aspects of your job search effectively.",
      category: "job-search",
      type: "checklist",
      isBookmarked: false,
      views: 6789,
      rating: 4.4,
      tags: ["checklist", "job search", "organization", "planning"],
      publishedDate: "2024-01-30",
      difficulty: "beginner",
      downloadUrl: "/downloads/job-search-checklist.pdf"
    },
    {
      id: "7",
      title: "Negotiating Your Salary: A Complete Guide",
      description: "Learn effective strategies for salary negotiation, from research to closing the deal.",
      category: "career-advice",
      type: "guide",
      readTime: 20,
      isBookmarked: false,
      views: 18765,
      rating: 4.8,
      tags: ["salary negotiation", "compensation", "career advancement", "negotiation"],
      publishedDate: "2024-02-01",
      author: "Jessica Adams, Negotiation Expert",
      difficulty: "advanced",
      downloadUrl: "/downloads/salary-negotiation-guide.pdf"
    },
    {
      id: "8",
      title: "First 90 Days: Succeeding in Your New Job",
      description: "Essential strategies for making a great impression and setting yourself up for success in a new role.",
      category: "workplace-tips",
      type: "article",
      readTime: 12,
      isBookmarked: false,
      views: 11234,
      rating: 4.6,
      tags: ["new job", "onboarding", "success", "workplace"],
      publishedDate: "2024-02-05",
      author: "Robert Kim, Career Strategist",
      difficulty: "intermediate"
    }
  ];

  // Load resources on component mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setResources(mockResources);
        setFilteredResources(mockResources);
      } catch (error) {
        toast({
          title: "Error Loading Resources",
          description: "Failed to load career resources. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [toast]);

  // Filter resources based on search and filters
  useEffect(() => {
    let filtered = resources;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    // Apply type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(resource => resource.difficulty === selectedDifficulty);
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm, selectedCategory, selectedType, selectedDifficulty]);

  const handleBookmark = (resourceId: string) => {
    setResources(prev => prev.map(resource =>
      resource.id === resourceId
        ? { ...resource, isBookmarked: !resource.isBookmarked }
        : resource
    ));
    
    toast({
      title: "Bookmark Updated",
      description: "Resource bookmark status has been updated.",
    });
  };

  const handleDownload = (resource: Resource) => {
    // In a real app, this would trigger the actual download
    toast({
      title: "Download Started",
      description: `Downloading ${resource.title}...`,
    });
  };

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'article': return FileText;
      case 'guide': return BookOpen;
      case 'template': return FileDown;
      case 'video': return PlayCircle;
      case 'checklist': return Target;
      default: return FileText;
    }
  };

  const getDifficultyColor = (difficulty: Resource['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Career Resources Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover guides, templates, and expert advice to accelerate your career growth.
              From resume writing to interview preparation, we've got you covered.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search Input */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search resources, guides, templates..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {resourceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Difficulty:</span>
              {['all', 'beginner', 'intermediate', 'advanced'].map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    selectedDifficulty === difficulty
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {difficulty === 'all' ? 'All Levels' : difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Category Quick Links */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.slice(1).map((category) => {
                const Icon = category.icon;
                const resourceCount = resources.filter(r => r.category === category.id).length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={24} className="mx-auto mb-2" />
                    <div className="text-xs font-medium text-center">
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {resourceCount} resources
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              Showing {filteredResources.length} of {resources.length} resources
              {searchTerm && ` for "${searchTerm}"`}
            </p>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Sort by popularity</span>
            </div>
          </div>

          {/* Resources Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const TypeIcon = getTypeIcon(resource.type);
                
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <TypeIcon size={18} className="text-blue-600" />
                            <Badge variant="outline" className="text-xs capitalize">
                              {resource.type}
                            </Badge>
                            <Badge variant="outline" className={`text-xs capitalize ${getDifficultyColor(resource.difficulty)}`}>
                              {resource.difficulty}
                            </Badge>
                          </div>
                          <button
                            onClick={() => handleBookmark(resource.id)}
                            className={`p-1 rounded-full transition-colors ${
                              resource.isBookmarked
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <Bookmark size={18} fill={resource.isBookmarked ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        
                        <CardTitle className="text-lg leading-tight">
                          {resource.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {resource.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {resource.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{resource.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-3">
                            {resource.readTime && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {resource.readTime} min read
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              {resource.views.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star size={12} />
                              {resource.rating}
                            </div>
                          </div>
                        </div>

                        {resource.author && (
                          <p className="text-xs text-gray-500 mb-3">
                            By {resource.author}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          {resource.downloadUrl && (
                            <Button
                              size="sm"
                              onClick={() => handleDownload(resource)}
                              className="flex-1"
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedType("all");
                  setSelectedDifficulty("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
            <p className="mb-6 opacity-90">
              Get the latest career resources and expert advice delivered to your inbox weekly.
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                placeholder="Enter your email"
                className="flex-1 bg-white/20 border-white/30 placeholder-white/70 text-white px-3 py-2 rounded"
              />
              <Button variant="secondary">
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResourcesPage;