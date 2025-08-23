import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Sparkles, 
  Star, 
  ArrowRight, 
  Gift,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

interface StorePromotionalBannerProps {
  className?: string;
  variant?: 'compact' | 'full';
}

const StorePromotionalBanner: React.FC<StorePromotionalBannerProps> = ({ 
  className = '', 
  variant = 'full' 
}) => {
  const navigate = useNavigate();

  const handleNavigateToStore = () => {
    navigate('/store');
  };

  if (variant === 'compact') {
    return (
      <Card className={`border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Need More Analysis?</h3>
                <p className="text-xs text-gray-600">Get professional resume reviews & more</p>
              </div>
            </div>
            <Button 
              onClick={handleNavigateToStore}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <span className="text-xs">Visit Store</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Promotional Banner */}
      <Card className="border-2 border-dashed border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 right-0">
          <div className="w-20 h-20 bg-yellow-400 rounded-full -mr-10 -mt-10 opacity-20"></div>
        </div>
        <div className="absolute bottom-0 left-0">
          <div className="w-16 h-16 bg-pink-400 rounded-full -ml-8 -mb-8 opacity-20"></div>
        </div>
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Gift className="w-3 h-3 mr-1" />
                  Limited Time
                </Badge>
                <Badge variant="outline" className="border-purple-200 text-purple-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium Services
                </Badge>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Unlock Professional Resume Services
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Get expert feedback from HR professionals, AI-powered resume building, and custom cover letters. 
                Take your job search to the next level with our premium services.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center text-xs text-gray-600">
                  <Users className="w-4 h-4 mr-2 text-blue-500" />
                  Expert Human Reviews
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  Fast 1-2 Day Delivery
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-500" />
                  Professional Writing
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Gift className="w-4 h-4 mr-2 text-red-500" />
                  Bundle Discounts
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleNavigateToStore}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Services
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleNavigateToStore}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  View Pricing
                </Button>
              </div>
            </div>
            
            <div className="hidden sm:block flex-shrink-0 ml-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer" onClick={handleNavigateToStore}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-green-800 text-sm mb-1">AI Resume Building</h3>
            <p className="text-xs text-green-600 mb-2">From AU$25</p>
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              1-2 Hours
            </Badge>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={handleNavigateToStore}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-blue-800 text-sm mb-1">Expert Review</h3>
            <p className="text-xs text-blue-600 mb-2">From AU$85</p>
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
              1-2 Days
            </Badge>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer" onClick={handleNavigateToStore}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-purple-800 text-sm mb-1">Complete Package</h3>
            <p className="text-xs text-purple-600 mb-2">AU$120 <span className="line-through text-gray-400">AU$150</span></p>
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
              Save AU$30
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StorePromotionalBanner;