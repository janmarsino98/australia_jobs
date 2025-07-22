import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, User, ArrowRight, TrendingUp, Code, Zap, Database } from 'lucide-react';
import { useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  imageUrl: string;
}

const TechBlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data for tech blog posts
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Building AusJobs: How We Scale Job Matching with AI',
      excerpt: 'Deep dive into our machine learning pipeline that matches millions of job seekers with relevant opportunities using advanced NLP and recommendation algorithms.',
      content: 'Full article content...',
      author: 'Sarah Chen',
      authorRole: 'Senior ML Engineer',
      publishDate: '2025-01-20',
      readTime: '8 min read',
      category: 'Machine Learning',
      tags: ['AI', 'NLP', 'Python', 'TensorFlow'],
      featured: true,
      imageUrl: '/api/placeholder/600/300'
    },
    {
      id: '2',
      title: 'Microservices at Scale: AusJobs Architecture Evolution',
      excerpt: 'Our journey from monolith to microservices, handling millions of daily requests across job search, application tracking, and user management systems.',
      content: 'Full article content...',
      author: 'David Kumar',
      authorRole: 'Principal Software Architect',
      publishDate: '2025-01-15',
      readTime: '12 min read',
      category: 'System Design',
      tags: ['Microservices', 'Docker', 'Kubernetes', 'AWS'],
      featured: true,
      imageUrl: '/api/placeholder/600/300'
    },
    {
      id: '3',
      title: 'Real-time Job Notifications: Building with WebSockets',
      excerpt: 'How we built a real-time notification system that delivers instant job alerts to millions of users with minimal latency and maximum reliability.',
      content: 'Full article content...',
      author: 'Emily Rodriguez',
      authorRole: 'Full Stack Engineer',
      publishDate: '2025-01-10',
      readTime: '6 min read',
      category: 'Backend',
      tags: ['WebSockets', 'Node.js', 'Redis', 'Real-time'],
      featured: false,
      imageUrl: '/api/placeholder/600/300'
    },
    {
      id: '4',
      title: 'Frontend Performance: How We Achieved 95+ PageSpeed Scores',
      excerpt: 'Performance optimization strategies that helped us deliver lightning-fast user experiences across desktop and mobile platforms.',
      content: 'Full article content...',
      author: 'Alex Thompson',
      authorRole: 'Senior Frontend Developer',
      publishDate: '2025-01-05',
      readTime: '10 min read',
      category: 'Frontend',
      tags: ['React', 'Performance', 'TypeScript', 'Vite'],
      featured: false,
      imageUrl: '/api/placeholder/600/300'
    },
    {
      id: '5',
      title: 'Data Pipeline Architecture for Job Market Analytics',
      excerpt: 'Building robust ETL pipelines to process job market data, salary trends, and employment statistics across Australia.',
      content: 'Full article content...',
      author: 'Michael Park',
      authorRole: 'Data Engineering Lead',
      publishDate: '2024-12-28',
      readTime: '15 min read',
      category: 'Data Engineering',
      tags: ['ETL', 'Apache Airflow', 'BigQuery', 'Analytics'],
      featured: false,
      imageUrl: '/api/placeholder/600/300'
    },
    {
      id: '6',
      title: 'Security Best Practices: Protecting User Data at Scale',
      excerpt: 'Comprehensive security measures we implement to protect millions of job seekers\' personal and professional information.',
      content: 'Full article content...',
      author: 'Lisa Wang',
      authorRole: 'Security Engineer',
      publishDate: '2024-12-20',
      readTime: '9 min read',
      category: 'Security',
      tags: ['Security', 'OAuth', 'Encryption', 'GDPR'],
      featured: true,
      imageUrl: '/api/placeholder/600/300'
    }
  ];

  const categories = ['all', 'Machine Learning', 'System Design', 'Frontend', 'Backend', 'Data Engineering', 'Security'];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (category) {
      case 'Machine Learning': return <Zap {...iconProps} />;
      case 'System Design': return <TrendingUp {...iconProps} />;
      case 'Frontend': return <Code {...iconProps} />;
      case 'Backend': return <Database {...iconProps} />;
      default: return <Code {...iconProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-main-white-bg">
      {/* Header Section */}
      <div className="bg-white border-b border-navbar-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-main-text mb-4">
              AusJobs Tech Blog
            </h1>
            <p className="text-searchbar-text max-w-2xl mx-auto">
              Behind the scenes of Australia's leading job platform. Discover the technology, 
              architecture, and engineering practices that power millions of job searches daily.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Featured Articles */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-main-text">Featured Articles</h2>
            <Button variant="outline" size="default">
              View All Posts
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPosts.slice(0, 2).map((post) => (
              <Card key={post.id} className="group cursor-pointer hover:shadow-lg transition-colors overflow-hidden">
                <div className="relative h-48">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    variant="default" 
                    className="absolute top-4 left-4 bg-pill-bg text-pill-text"
                  >
                    Featured
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {getCategoryIcon(post.category)}
                      {post.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-searchbar-text">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-main-text group-hover:text-pill-text transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-searchbar-text">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-searchbar-text" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-main-text">{post.author}</p>
                        <p className="text-xs text-searchbar-text">{post.authorRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-searchbar-text">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
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
                className="capitalize flex items-center gap-2"
              >
                {category !== 'all' && getCategoryIcon(category)}
                {category === 'all' ? 'All Articles' : category}
              </Button>
            ))}
          </div>
        </section>

        {/* All Articles Grid */}
        <section>
          <h2 className="text-2xl font-semibold text-main-text mb-6">
            {selectedCategory === 'all' ? 'Latest Articles' : selectedCategory}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="group cursor-pointer hover:shadow-lg transition-colors overflow-hidden">
                <div className="relative h-40">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  {post.featured && (
                    <Badge 
                      variant="default" 
                      className="absolute top-2 right-2 bg-destructive text-white text-xs"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {getCategoryIcon(post.category)}
                      {post.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-searchbar-text">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                  <CardTitle className="text-[16px] font-semibold text-main-text group-hover:text-pill-text transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-searchbar-text mb-4 line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-3 h-3 text-searchbar-text" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-main-text">{post.author}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-searchbar-text">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-2 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 group-hover:bg-pill-bg">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="mt-16 bg-white rounded-lg border p-8 text-center">
          <h2 className="text-2xl font-semibold text-main-text mb-4">
            Stay Updated with Our Tech Insights
          </h2>
          <p className="text-searchbar-text mb-6 max-w-2xl mx-auto">
            Get the latest articles on software engineering, system design, and technology 
            trends delivered straight to your inbox. Join our community of tech professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="default">
              Subscribe to Newsletter
            </Button>
            <Button variant="outline" size="default">
              Follow on GitHub
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-navbar-border">
            <div className="text-center">
              <p className="text-2xl font-semibold text-main-text">50+</p>
              <p className="text-sm text-searchbar-text">Tech Articles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-main-text">15K+</p>
              <p className="text-sm text-searchbar-text">Monthly Readers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-main-text">25+</p>
              <p className="text-sm text-searchbar-text">Expert Authors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-main-text">99.9%</p>
              <p className="text-sm text-searchbar-text">Platform Uptime</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TechBlogPage;