import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Key, CheckCircle, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Admin2FAProps {
  onClose: () => void;
  onVerified: () => void;
  userEmail: string;
}

interface TwoFactorState {
  isEnabled: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
}

export default function Admin2FA({ onClose, onVerified, userEmail }: Admin2FAProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'verify' | 'setup' | 'backup'>('verify');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    isEnabled: true, // Simulate existing 2FA setup
  });

  // Simulate checking 2FA status
  useEffect(() => {
    const check2FAStatus = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate that admin already has 2FA enabled
      setTwoFactorState({
        isEnabled: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        secret: 'JBSWY3DPEHPK3PXP',
        backupCodes: [
          '12345-67890',
          '23456-78901',
          '34567-89012',
          '45678-90123',
          '56789-01234'
        ]
      });
      
      setIsLoading(false);
    };

    check2FAStatus();
  }, []);

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, accept any 6-digit code
    if (verificationCode.length === 6) {
      toast({
        title: '2FA Verified',
        description: 'Two-factor authentication successful.',
      });
      onVerified();
    } else {
      toast({
        title: 'Verification Failed',
        description: 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 5 }, (_, i) => {
      const code1 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const code2 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      return `${code1}-${code2}`;
    });

    setTwoFactorState(prev => ({ ...prev, backupCodes: codes }));
    setStep('backup');

    toast({
      title: 'Backup Codes Generated',
      description: 'Save these codes in a secure location.',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  if (isLoading && !twoFactorState.isEnabled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-medical-blue" />
            <p>Checking 2FA status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-medical-blue" />
              <span>Two-Factor Authentication</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-medical-green">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
            <span className="text-sm text-gray-600">Enhanced security active</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Smartphone className="h-12 w-12 text-medical-blue mx-auto" />
                <h3 className="text-lg font-semibold">Enter Verification Code</h3>
                <p className="text-gray-600">
                  Open your authenticator app and enter the 6-digit code for {userEmail}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button
                onClick={handleVerification}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-medical-blue hover:bg-medical-blue-dark"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify & Continue
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Having trouble?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateBackupCodes}
                  disabled={isLoading}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Use Backup Code
                </Button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Key className="h-12 w-12 text-medical-amber mx-auto" />
                <h3 className="text-lg font-semibold">Backup Codes</h3>
                <p className="text-gray-600">
                  Save these backup codes in a secure location. Each code can only be used once.
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Store these codes securely. You can use them to access your account if you lose access to your authenticator app.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-2 font-mono text-sm">
                  {twoFactorState.backupCodes?.map((code, index) => (
                    <div key={index} className="p-2 bg-white rounded border text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('verify')}
                  className="flex-1"
                >
                  Back to Verification
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(twoFactorState.backupCodes?.join('\n') || '');
                    toast({
                      title: 'Copied to Clipboard',
                      description: 'Backup codes have been copied to your clipboard.',
                    });
                  }}
                  className="flex-1 bg-medical-blue hover:bg-medical-blue-dark"
                >
                  Copy Codes
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            This is a demonstration of 2FA integration. In production, this would connect to services like Google Authenticator, Authy, or SMS verification.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}