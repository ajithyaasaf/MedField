import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Clock, Mail, MessageSquare, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  onClose: () => void;
}

interface NotificationPreferences {
  clockReminders: boolean;
  quotationAlerts: boolean;
  scheduleNotifications: boolean;
  locationWarnings: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderTime: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    clockReminders: true,
    quotationAlerts: true,
    scheduleNotifications: true,
    locationWarnings: true,
    emailNotifications: false,
    smsNotifications: false,
    reminderTime: '30',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  const handleSave = () => {
    // Save preferences to localStorage or send to server
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    
    toast({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated.',
    });
    
    onClose();
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateQuietHours = (key: keyof NotificationPreferences['quietHours'], value: any) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value,
      },
    }));
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-6 w-6 text-medical-blue" />
              <span>Notification Settings</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Push Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Push Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-medical-blue" />
                  <div>
                    <Label htmlFor="clock-reminders">Clock Out Reminders</Label>
                    <p className="text-sm text-gray-600">Remind me to clock out at end of day</p>
                  </div>
                </div>
                <Switch
                  id="clock-reminders"
                  checked={preferences.clockReminders}
                  onCheckedChange={(checked) => updatePreference('clockReminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-medical-amber" />
                  <div>
                    <Label htmlFor="quotation-alerts">Quotation Alerts</Label>
                    <p className="text-sm text-gray-600">Alert when quotations need follow-up</p>
                  </div>
                </div>
                <Switch
                  id="quotation-alerts"
                  checked={preferences.quotationAlerts}
                  onCheckedChange={(checked) => updatePreference('quotationAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-medical-green" />
                  <div>
                    <Label htmlFor="schedule-notifications">Schedule Notifications</Label>
                    <p className="text-sm text-gray-600">Upcoming visit reminders</p>
                  </div>
                </div>
                <Switch
                  id="schedule-notifications"
                  checked={preferences.scheduleNotifications}
                  onCheckedChange={(checked) => updatePreference('scheduleNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-medical-red" />
                  <div>
                    <Label htmlFor="location-warnings">Location Warnings</Label>
                    <p className="text-sm text-gray-600">Alert when outside geo-fence areas</p>
                  </div>
                </div>
                <Switch
                  id="location-warnings"
                  checked={preferences.locationWarnings}
                  onCheckedChange={(checked) => updatePreference('locationWarnings', checked)}
                />
              </div>
            </div>
          </div>

          {/* Reminder Timing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Reminder Timing</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="reminder-time">Clock Out Reminder</Label>
                <Select 
                  value={preferences.reminderTime} 
                  onValueChange={(value) => updatePreference('reminderTime', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes before end of day</SelectItem>
                    <SelectItem value="30">30 minutes before end of day</SelectItem>
                    <SelectItem value="60">1 hour before end of day</SelectItem>
                    <SelectItem value="120">2 hours before end of day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Communication Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Communication Channels</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-medical-blue" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send important updates via email</p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-medical-green" />
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Send urgent alerts via SMS</p>
                  </div>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Quiet Hours</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                  <p className="text-sm text-gray-600">No notifications during specified times</p>
                </div>
                <Switch
                  id="quiet-hours"
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
                />
              </div>
              
              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <input
                      type="time"
                      id="quiet-start"
                      value={preferences.quietHours.start}
                      onChange={(e) => updateQuietHours('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <input
                      type="time"
                      id="quiet-end"
                      value={preferences.quietHours.end}
                      onChange={(e) => updateQuietHours('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-medical-blue hover:bg-medical-blue-dark">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}