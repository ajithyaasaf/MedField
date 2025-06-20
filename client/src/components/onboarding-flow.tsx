import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  MapPin, 
  FileText, 
  User, 
  ArrowRight,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';

interface OnboardingFlowProps {
  onComplete: (data: any) => void;
  userRole: 'field_rep' | 'admin';
}

export default function OnboardingFlow({ onComplete, userRole }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    employeeId: '',
    territory: '',
    phone: '',
    email: '',
  });
  
  const { location, error: locationError } = useGeolocation();

  const totalSteps = userRole === 'field_rep' ? 4 : 3;
  const progress = (currentStep / totalSteps) * 100;

  const requestLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted' || permission.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationPermission(true);
            setCurrentStep(currentStep + 1);
          },
          (error) => {
            console.error('Location permission denied:', error);
          }
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        termsAccepted,
        locationPermission,
        profileData,
      });
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return termsAccepted;
      case 2:
        return locationPermission;
      case 3:
        return profileData.name && profileData.employeeId;
      case 4:
        return true; // Final step
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-6 w-6 text-medical-blue" />
            <span>Welcome to MedField Pro</span>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Terms & Conditions */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 text-medical-blue mx-auto" />
                <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                <p className="text-gray-600">
                  Please review and accept our terms of service to continue
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto text-sm">
                <h4 className="font-medium mb-2">MedField Pro Terms of Service</h4>
                <p className="mb-2">
                  By using MedField Pro, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Protect confidential patient and hospital information</li>
                  <li>Use location services only for legitimate business purposes</li>
                  <li>Maintain accurate attendance and visit records</li>
                  <li>Follow company policies for client interactions</li>
                  <li>Report any system issues or security concerns promptly</li>
                </ul>
                <p className="mt-3 text-xs text-gray-600">
                  Last updated: June 2025
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I have read and accept the Terms & Conditions
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Location Permission */}
          {currentStep === 2 && userRole === 'field_rep' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <MapPin className="h-12 w-12 text-medical-green mx-auto" />
                <h3 className="text-lg font-semibold">Location Services</h3>
                <p className="text-gray-600">
                  We need location access for accurate attendance tracking and geo-fence compliance
                </p>
              </div>
              
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  Location data is used exclusively for:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Automatic clock in/out at hospital sites</li>
                    <li>Verifying visits within designated areas</li>
                    <li>Emergency assistance if needed</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {locationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Location permission is required for field representatives. 
                    Please enable location services in your browser settings.
                  </AlertDescription>
                </Alert>
              )}
              
              {!locationPermission && (
                <Button 
                  onClick={requestLocationPermission}
                  className="w-full bg-medical-green hover:bg-medical-green-dark"
                >
                  Enable Location Services
                </Button>
              )}
              
              {locationPermission && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Location services enabled</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Profile Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <User className="h-12 w-12 text-medical-blue mx-auto" />
                <h3 className="text-lg font-semibold">Profile Setup</h3>
                <p className="text-gray-600">
                  Complete your profile information
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={profileData.employeeId}
                    onChange={(e) => setProfileData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Enter your employee ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="territory">Territory</Label>
                  <Input
                    id="territory"
                    value={profileData.territory}
                    onChange={(e) => setProfileData(prev => ({ ...prev, territory: e.target.value }))}
                    placeholder="Enter your assigned territory"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Completion */}
          {currentStep === totalSteps && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <CheckCircle className="h-12 w-12 text-medical-green mx-auto" />
                <h3 className="text-lg font-semibold">Setup Complete!</h3>
                <p className="text-gray-600">
                  Welcome to MedField Pro. You're ready to start using the platform.
                </p>
              </div>
              
              <div className="bg-medical-blue bg-opacity-10 p-4 rounded-lg">
                <h4 className="font-medium text-medical-blue mb-2">Quick Start Tips:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  {userRole === 'field_rep' ? (
                    <>
                      <li>• Use the Clock In/Out buttons when visiting hospitals</li>
                      <li>• Create quotations using the New Quote button</li>
                      <li>• Check your schedule daily for upcoming visits</li>
                      <li>• Enable notifications for important updates</li>
                    </>
                  ) : (
                    <>
                      <li>• Monitor field rep activities from the dashboard</li>
                      <li>• Review and approve quotations as they come in</li>
                      <li>• Manage geo-fences and user permissions</li>
                      <li>• Generate reports for performance analysis</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="bg-medical-blue hover:bg-medical-blue-dark"
            >
              {currentStep === totalSteps ? 'Get Started' : 'Next'}
              {currentStep < totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}