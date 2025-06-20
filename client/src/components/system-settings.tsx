import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Building, 
  Mail, 
  MessageSquare, 
  Shield, 
  Clock,
  Palette,
  FileText,
  X,
  Save,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSettingsProps {
  onClose: () => void;
}

export default function SystemSettings({ onClose }: SystemSettingsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState({
    company: {
      name: 'MedField Pro',
      address: '123 Medical Plaza, Healthcare District',
      phone: '+1-555-MEDFIELD',
      email: 'info@medfieldpro.com',
      website: 'www.medfieldpro.com',
      logo: null as File | null,
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      fromName: 'MedField Pro',
      fromEmail: 'noreply@medfieldpro.com',
      signature: 'Best regards,\nMedField Pro Team\nExcellence in Medical Equipment Solutions',
    },
    sms: {
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      enableSMS: false,
    },
    notifications: {
      enableEmail: true,
      enableSMS: false,
      enablePush: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      attendanceReminders: true,
      quotationAlerts: true,
      adminNotifications: true,
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: '24',
      passwordMinLength: '8',
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      loginAttempts: '5',
      lockoutDuration: '30',
    },
    attendance: {
      gracePeriod: '15',
      autoClockOut: '18:00',
      requiredCheckIn: true,
      geoFenceStrict: false,
      manualApprovalRequired: true,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    audit: {
      retentionPeriod: '365',
      logLevel: 'info',
      enableAuditTrail: true,
      anonymizeData: false,
      backupFrequency: 'daily',
    }
  });

  const handleSave = (section: string) => {
    // Simulate API call to save settings
    toast({
      title: 'Settings Saved',
      description: `${section.charAt(0).toUpperCase() + section.slice(1)} settings have been updated successfully.`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSettings(prev => ({
        ...prev,
        company: { ...prev.company, logo: file }
      }));
    }
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [key]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-medical-blue" />
              <span>System Settings</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            {/* Company Settings */}
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-medical-blue" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.company.name}
                        onChange={(e) => updateSetting('company', 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={settings.company.email}
                        onChange={(e) => updateSetting('company', 'email', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="companyAddress">Address</Label>
                    <Textarea
                      id="companyAddress"
                      value={settings.company.address}
                      onChange={(e) => updateSetting('company', 'address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyPhone">Phone</Label>
                      <Input
                        id="companyPhone"
                        value={settings.company.phone}
                        onChange={(e) => updateSetting('company', 'phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyWebsite">Website</Label>
                      <Input
                        id="companyWebsite"
                        value={settings.company.website}
                        onChange={(e) => updateSetting('company', 'website', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="companyLogo">Company Logo</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="companyLogo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="flex-1"
                      />
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.company.primaryColor}
                          onChange={(e) => updateSetting('company', 'primaryColor', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          value={settings.company.primaryColor}
                          onChange={(e) => updateSetting('company', 'primaryColor', e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.company.secondaryColor}
                          onChange={(e) => updateSetting('company', 'secondaryColor', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          value={settings.company.secondaryColor}
                          onChange={(e) => updateSetting('company', 'secondaryColor', e.target.value)}
                          placeholder="#10B981"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('company')} className="bg-medical-blue hover:bg-medical-blue-dark">
                    <Save className="h-4 w-4 mr-2" />
                    Save Company Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-medical-blue" />
                    Email Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.email.smtpHost}
                        onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        value={settings.email.smtpPort}
                        onChange={(e) => updateSetting('email', 'smtpPort', e.target.value)}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={settings.email.smtpUser}
                        onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
                        placeholder="your.email@gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                        placeholder="App password"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={settings.email.fromName}
                        onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="emailSignature">Email Signature</Label>
                    <Textarea
                      id="emailSignature"
                      value={settings.email.signature}
                      onChange={(e) => updateSetting('email', 'signature', e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <Button onClick={() => handleSave('email')} className="bg-medical-blue hover:bg-medical-blue-dark">
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-medical-red" />
                    Security & Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Require 2FA for admin users</p>
                    </div>
                    <Switch
                      checked={settings.security.requireTwoFactor}
                      onCheckedChange={(checked) => updateSetting('security', 'requireTwoFactor', checked)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSetting('security', 'passwordMinLength', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Require Special Characters</Label>
                      <Switch
                        checked={settings.security.passwordRequireSpecial}
                        onCheckedChange={(checked) => updateSetting('security', 'passwordRequireSpecial', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require Numbers</Label>
                      <Switch
                        checked={settings.security.passwordRequireNumbers}
                        onCheckedChange={(checked) => updateSetting('security', 'passwordRequireNumbers', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        value={settings.security.loginAttempts}
                        onChange={(e) => updateSetting('security', 'loginAttempts', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        value={settings.security.lockoutDuration}
                        onChange={(e) => updateSetting('security', 'lockoutDuration', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={() => handleSave('security')} className="bg-medical-red hover:bg-red-600">
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Settings */}
            <TabsContent value="audit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-medical-amber" />
                    Audit & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Audit Trail</Label>
                      <p className="text-sm text-gray-600">Log all user actions and system events</p>
                    </div>
                    <Switch
                      checked={settings.audit.enableAuditTrail}
                      onCheckedChange={(checked) => updateSetting('audit', 'enableAuditTrail', checked)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="retentionPeriod">Data Retention Period (days)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        value={settings.audit.retentionPeriod}
                        onChange={(e) => updateSetting('audit', 'retentionPeriod', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logLevel">Log Level</Label>
                      <Select value={settings.audit.logLevel} onValueChange={(value) => updateSetting('audit', 'logLevel', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymize Sensitive Data</Label>
                      <p className="text-sm text-gray-600">Remove PII from logs after retention period</p>
                    </div>
                    <Switch
                      checked={settings.audit.anonymizeData}
                      onCheckedChange={(checked) => updateSetting('audit', 'anonymizeData', checked)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={settings.audit.backupFrequency} onValueChange={(value) => updateSetting('audit', 'backupFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={() => handleSave('audit')} className="bg-medical-amber hover:bg-yellow-600">
                    <Save className="h-4 w-4 mr-2" />
                    Save Audit Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}