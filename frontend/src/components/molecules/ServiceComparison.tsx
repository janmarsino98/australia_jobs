import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Product } from '../../types/store';

interface ServiceComparisonProps {
  aiService?: Product;
  professionalService?: Product;
  onSelectService: (product: Product) => void;
  className?: string;
}

const COMPARISON_FEATURES = [
  'Delivery Time',
  'Price',
  'Quality Level',
  'Revision Rounds',
  'Personal Consultation',
  'Industry Expertise'
];

export const ServiceComparison: React.FC<ServiceComparisonProps> = ({
  aiService,
  professionalService,
  onSelectService,
  className = '',
}) => {
  const getFeatureComparison = (feature: string, product?: Product) => {
    if (!product) return { value: 'N/A', status: 'unavailable' };

    switch (feature) {
      case 'Delivery Time':
        return { 
          value: product.deliveryTime, 
          status: product.deliveryTime.toLowerCase().includes('instant') ? 'excellent' : 'good'
        };
      case 'Price':
        return { 
          value: product.price === 0 ? 'FREE' : `AU$${product.price}`, 
          status: product.price === 0 ? 'excellent' : 'standard'
        };
      case 'Quality Level':
        return { 
          value: product.category === 'ai-service' ? 'Automated' : 'Expert Review', 
          status: product.category === 'ai-service' ? 'good' : 'excellent'
        };
      case 'Revision Rounds':
        return { 
          value: product.category === 'ai-service' ? 'Unlimited' : '3 Rounds', 
          status: 'good'
        };
      case 'Personal Consultation':
        return { 
          value: product.category === 'ai-service' ? 'Not Included' : '30 min Call', 
          status: product.category === 'ai-service' ? 'unavailable' : 'excellent'
        };
      case 'Industry Expertise':
        return { 
          value: product.category === 'ai-service' ? 'General' : 'Industry Specific', 
          status: product.category === 'ai-service' ? 'standard' : 'excellent'
        };
      default:
        return { value: 'Unknown', status: 'unavailable' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'standard': return 'text-yellow-600 bg-yellow-50';
      case 'unavailable': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return '✅';
      case 'good': return '👍';
      case 'standard': return '⚠️';
      case 'unavailable': return '❌';
      default: return '❓';
    }
  };

  if (!aiService && !professionalService) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center text-muted-foreground">
          No services available for comparison
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-main-text mb-2">
          AI vs Professional Services
        </h3>
        <p className="text-muted-foreground">
          Compare our AI-powered and professional resume services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Service Column */}
        {aiService && (
          <Card className="border-blue-200">
            <CardHeader className="text-center bg-blue-50 rounded-t-lg">
              <Badge className="bg-pill-bg text-pill-text w-fit mx-auto mb-2">
                AI Powered
              </Badge>
              <CardTitle className="text-xl">{aiService.name}</CardTitle>
              <CardDescription>{aiService.shortDescription}</CardDescription>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {aiService.price === 0 ? 'FREE' : `AU$${aiService.price}`}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {COMPARISON_FEATURES.map((feature) => {
                  const comparison = getFeatureComparison(feature, aiService);
                  return (
                    <div key={feature} className="flex justify-between items-center">
                      <span className="font-medium text-sm">{feature}:</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(comparison.status)}`}>
                        <span>{getStatusIcon(comparison.status)}</span>
                        <span>{comparison.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={() => onSelectService(aiService)}
              >
                {aiService.price === 0 ? 'Get Free Review' : 'Select AI Service'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Professional Service Column */}
        {professionalService && (
          <Card className="border-green-200">
            <CardHeader className="text-center bg-green-50 rounded-t-lg">
              <Badge variant="secondary" className="w-fit mx-auto mb-2">
                Professional
              </Badge>
              <CardTitle className="text-xl">{professionalService.name}</CardTitle>
              <CardDescription>{professionalService.shortDescription}</CardDescription>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                AU${professionalService.price}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {COMPARISON_FEATURES.map((feature) => {
                  const comparison = getFeatureComparison(feature, professionalService);
                  return (
                    <div key={feature} className="flex justify-between items-center">
                      <span className="font-medium text-sm">{feature}:</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(comparison.status)}`}>
                        <span>{getStatusIcon(comparison.status)}</span>
                        <span>{comparison.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={() => onSelectService(professionalService)}
              >
                Select Professional Service
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom comparison summary */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <h4 className="font-semibold text-center mb-4">Quick Comparison</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-600">AI Service</div>
              <div>✅ Instant results</div>
              <div>✅ Free option available</div>
              <div>⚠️ Automated analysis</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">Professional Service</div>
              <div>✅ Human expertise</div>
              <div>✅ Personal consultation</div>
              <div>✅ Industry-specific advice</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceComparison;