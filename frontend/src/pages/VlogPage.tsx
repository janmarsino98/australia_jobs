import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Play, Calendar, Eye, Share2, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

interface VlogPost {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  publishDate: string;
  viewCount: string;
  likeCount: string;
  category: string;
  featured: boolean;
}

const VlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data for vlogs following AusJobs career theme
  const vlogPosts: VlogPost[] = [
    {
      id: '1',
      title: 'Landing Your Dream Job in Australia: Complete Guide',
      description: 'A comprehensive walkthrough of the Australian job market, from application to interview success. Learn insider tips from HR professionals.',
      thumbnailUrl: '/api/placeholder/400/225',
      videoUrl: '#',
      duration: '12:45',
      publishDate: '2025-01-15',
      viewCount: '2.3K',
      likeCount: '89',
      category: 'Career Tips',
      featured: true
    },
    {
      id: '2', 
      title: 'Resume Makeover: Before & After Transformation',
      description: 'Watch as we transform a struggling resume into an ATS-friendly, recruiter-approved masterpiece that gets results.',
      thumbnailUrl: '/api/placeholder/400/225',
      videoUrl: '#',
      duration: '8:32',
      publishDate: '2025-01-10',
      viewCount: '1.8K',
      likeCount: '156',
      category: 'Resume Tips',
      featured: false
    },
    {
      id: '3',
      title: 'Tech Industry Insights: What Employers Really Want',
      description: 'Exclusive interviews with tech recruiters and hiring managers sharing what they look for in candidates.',
      thumbnailUrl: '/api/placeholder/400/225',
      videoUrl: '#',
      duration: '15:20',
      publishDate: '2025-01-05',
      viewCount: '3.1K',
      likeCount: '203',
      category: 'Industry Insights',
      featured: true
    },
    {
      id: '4',
      title: 'Salary Negotiation Masterclass',
      description: 'Learn proven strategies to negotiate your salary with confidence and secure the compensation you deserve.',
      thumbnailUrl: '/api/placeholder/400/225',
      videoUrl: '#',
      duration: '11:18',
      publishDate: '2024-12-28',
      viewCount: '4.2K',
      likeCount: '387',
      category: 'Career Tips',
      featured: false
    },
    {
      id: '5',
      title: 'Remote Work Setup: Productivity Tips for Job Seekers',
      description: 'Create the perfect home office setup and develop habits that will impress remote employers.',
      thumbnailUrl: '/api/placeholder/400/225',
      videoUrl: '#',
      duration: '9:45',
      publishDate: '2024-12-20',
      viewCount: '1.5K',
      likeCount: '92',
      category: 'Remote Work',
      featured: false
    }
  ];

  const categories = ['all', 'Career Tips', 'Resume Tips', 'Industry Insights', 'Remote Work'];

  const filteredPosts = selectedCategory === 'all' 
    ? vlogPosts 
    : vlogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = vlogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-main-white-bg">
      {/* Header Section */}
      <div className="bg-white border-b border-navbar-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-main-text mb-4">
              AusJobs Career Vlog
            </h1>
            <p className="text-searchbar-text max-w-2xl mx-auto">
              Get insider insights, career advice, and job search tips from industry experts. 
              Watch real success stories and learn strategies that actually work in the Australian job market.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Featured Videos Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-main-text">Featured Videos</h2>
            <Button variant="outline" size="default">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredPosts.map((post) => (
              <Card key={post.id} className="group cursor-pointer hover:shadow-lg transition-colors">
                <div className="relative">
                  <img 
                    src={post.thumbnailUrl} 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-lg group-hover:bg-opacity-30 transition-colors flex items-center justify-center">
                    <Button variant="default" size="default" className="bg-white bg-opacity-90 text-main-text hover:bg-opacity-100">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Now
                    </Button>
                  </div>
                  <Badge 
                    variant="default" 
                    className="absolute top-3 right-3 bg-pill-bg text-pill-text"
                  >
                    {post.duration}
                  </Badge>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Featured
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-main-text line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-searchbar-text">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-searchbar-text">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {post.likeCount}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="default"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Videos' : category}
              </Button>
            ))}
          </div>
        </section>

        {/* All Videos Grid */}
        <section>
          <h2 className="text-2xl font-semibold text-main-text mb-6">
            {selectedCategory === 'all' ? 'All Videos' : selectedCategory}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="group cursor-pointer hover:shadow-lg transition-colors">
                <div className="relative">
                  <img 
                    src={post.thumbnailUrl} 
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-lg group-hover:bg-opacity-30 transition-colors flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="bg-white bg-opacity-90 text-main-text hover:bg-opacity-100">
                      <Play className="w-6 h-6" />
                    </Button>
                  </div>
                  <Badge 
                    variant="default" 
                    className="absolute top-2 right-2 bg-pill-bg text-pill-text text-xs"
                  >
                    {post.duration}
                  </Badge>
                  {post.featured && (
                    <Badge 
                      variant="default" 
                      className="absolute top-2 left-2 bg-destructive text-white text-xs"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="text-xs w-fit">
                    {post.category}
                  </Badge>
                  <CardTitle className="text-[16px] font-semibold text-main-text line-clamp-2 mt-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-searchbar-text mb-3 line-clamp-2">
                    {post.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-xs text-searchbar-text">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likeCount}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 bg-white rounded-lg border p-8 text-center">
          <h2 className="text-2xl font-semibold text-main-text mb-4">
            Want to Stay Updated?
          </h2>
          <p className="text-searchbar-text mb-6 max-w-2xl mx-auto">
            Subscribe to our channel to get notified about new career tips, industry insights, 
            and success stories that can help accelerate your job search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="default">
              Subscribe to Updates
            </Button>
            <Button variant="outline" size="default">
              Browse Job Opportunities
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VlogPage;