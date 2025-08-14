import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import usePaymentStore, { CustomerDetails } from '@/stores/usePaymentStore';
import { useAuthStore } from '@/stores';

interface UserDetailsFormProps {
  onNext: () => void;
  onBack?: () => void;
}

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ onNext, onBack }) => {
  const { customerDetails, updateCustomerDetails, setError, error } = usePaymentStore();
  const { user, isAuthenticated } = useAuthStore();
  const [localDetails, setLocalDetails] = useState<CustomerDetails>({
    email: customerDetails.email || user?.email || '',
    firstName: customerDetails.firstName || user?.profile?.first_name || '',
    lastName: customerDetails.lastName || user?.profile?.last_name || '',
    phone: customerDetails.phone || user?.profile?.phone || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setLocalDetails(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!localDetails.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!localDetails.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!localDetails.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localDetails.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Update the store with the form data
      updateCustomerDetails(localDetails);
      onNext();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Your Details</CardTitle>
        <p className="text-sm text-gray-600">
          Please provide your contact information for order processing
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isAuthenticated && user && (
            <Alert>
              <AlertDescription>
                We've pre-filled some details from your account. You can modify them if needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name *
              </label>
              <Input
                id="firstName"
                type="text"
                value={localDetails.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                required
                aria-describedby={error ? "form-error" : undefined}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name *
              </label>
              <Input
                id="lastName"
                type="text"
                value={localDetails.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                required
                aria-describedby={error ? "form-error" : undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </label>
            <Input
              id="email"
              type="email"
              value={localDetails.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              required
              aria-describedby={error ? "form-error" : undefined}
            />
            <p className="text-xs text-gray-500">
              Your order confirmation will be sent to this email
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number (Optional)
            </label>
            <Input
              id="phone"
              type="tel"
              value={localDetails.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
            />
            <p className="text-xs text-gray-500">
              For professional services, we may contact you to discuss requirements
            </p>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="ml-auto"
        >
          {isSubmitting ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserDetailsForm;