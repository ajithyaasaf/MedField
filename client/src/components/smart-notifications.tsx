import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  Settings,
  Smartphone,
  Mail,
  Volume2,
  VolumeX
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SmartNotificationsProps {
  className?: string;
}

interface GeoFenceAlert {
  id: string;
  userId: number;
  userName: string;
  geoFenceId: number;
  geoFenceName: string;
  hospitalName: string;
  alertType: 'approaching' | 'entered' | 'exited' | 'missed';
  distance: number;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
  acknowledged: boolean;
}

interface NoShowAlert {
  id: string;
  userId: number;
  userName: string;
  hospitalId: number;
  hospitalName: string;
  scheduledTime: Date;
  missedDuration: number;
  lastKnownLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

interface NotificationSettings {
  geoFenceAlerts: {
    enabled: boolean;
    approachingRadius: number;
    soundEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  noShowAlerts: {
    enabled: boolean;
    gracePeriod: number;
    escalationTime: number;
    soundEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  generalSettings: {
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
    priority: 'all' | 'high' | 'critical';
    batchNotifications: boolean;
  };
}

export default function SmartNotifications({ className }: SmartNotificationsProps) {
  const [activeTab, setActiveTab] = useState("alerts");
  const [settings, setSettings] = useState<NotificationSettings>({
    geoFenceAlerts: {
      enabled: true,
      approachingRadius: 200,
      soundEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
    },
    noShowAlerts: {
      enabled: true,
      gracePeriod: 15,
      escalationTime: 30,
      soundEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
    },
    generalSettings: {
      quietHours: {
        enabled: false,
        startTime: "22:00",
        endTime: "08:00",
      },
      priority: 'all',
      batchNotifications: false,
    },
  });
  const { toast } = useToast();

  const { data: geoFenceAlerts, refetch: refetchGeoAlerts } = useQuery({
    queryKey: ['/api/notifications/geo-fence-alerts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: noShowAlerts, refetch: refetchNoShowAlerts } = useQuery({
    queryKey: ['/api/notifications/no-show-alerts'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: geoFences } = useQuery({
    queryKey: ['/api/geo-fences'],
  });

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  // Mock data for demonstration
  const mockGeoFenceAlerts: GeoFenceAlert[] = [
    {
      id: "gf1",
      userId: 3,
      userName: "Sarah Johnson",
      geoFenceId: 1,
      geoFenceName: "St. Mary's Hospital Zone",
      hospitalName: "St. Mary's Hospital",
      alertType: "approaching",
      distance: 150,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      location: { lat: 40.7128, lng: -74.0060 },
      acknowledged: false,
    },
    {
      id: "gf2",
      userId: 4,
      userName: "Mike Chen",
      geoFenceId: 2,
      geoFenceName: "General Medical Center Zone",
      hospitalName: "General Medical Center",
      alertType: "entered",
      distance: 0,
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      location: { lat: 40.7589, lng: -73.9851 },
      acknowledged: true,
    },
    {
      id: "gf3",
      userId: 5,
      userName: "Anna Martinez",
      geoFenceId: 3,
      geoFenceName: "City Health Complex Zone",
      hospitalName: "City Health Complex",
      alertType: "missed",
      distance: 800,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      location: { lat: 40.7419, lng: -74.0132 },
      acknowledged: false,
    },
  ];

  const mockNoShowAlerts: NoShowAlert[] = [
    {
      id: "ns1",
      userId: 3,
      userName: "Sarah Johnson",
      hospitalId: 1,
      hospitalName: "St. Mary's Hospital",
      scheduledTime: new Date(Date.now() - 45 * 60 * 1000),
      missedDuration: 45,
      lastKnownLocation: {
        lat: 40.7128,
        lng: -74.0060,
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
      },
      severity: "medium",
      acknowledged: false,
    },
    {
      id: "ns2",
      userId: 5,
      userName: "Anna Martinez",
      hospitalId: 3,
      hospitalName: "City Health Complex",
      scheduledTime: new Date(Date.now() - 120 * 60 * 1000),
      missedDuration: 120,
      severity: "high",
      acknowledged: false,
    },
  ];

  const currentGeoAlerts = geoFenceAlerts || mockGeoFenceAlerts;
  const currentNoShowAlerts = noShowAlerts || mockNoShowAlerts;

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ alertId, type }: { alertId: string; type: 'geo-fence' | 'no-show' }) => {
      const response = await apiRequest("POST", `/api/notifications/acknowledge`, { alertId, type });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as acknowledged.",
      });
      refetchGeoAlerts();
      refetchNoShowAlerts();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const response = await apiRequest("PUT", "/api/notifications/settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Notification settings have been saved successfully.",
      });
    },
  });

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'approaching': return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'entered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exited': return <XCircle className="h-4 w-4 text-orange-600" />;
      case 'missed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unacknowledgedGeoAlerts = currentGeoAlerts.filter(alert => !alert.acknowledged);
  const unacknowledgedNoShowAlerts = currentNoShowAlerts.filter(alert => !alert.acknowledged);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Alert Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="h-6 w-6 mr-2 text-blue-600" />
            Smart Notifications
          </h2>
          <p className="text-gray-600">Real-time geo-fence and attendance alerts</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="destructive" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {unacknowledgedGeoAlerts.length + unacknowledgedNoShowAlerts.length} Active Alerts
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Alert Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === "alerts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("alerts")}
          className="flex-1"
        >
          Active Alerts ({unacknowledgedGeoAlerts.length + unacknowledgedNoShowAlerts.length})
        </Button>
        <Button
          variant={activeTab === "geo-fence" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("geo-fence")}
          className="flex-1"
        >
          Geo-Fence ({unacknowledgedGeoAlerts.length})
        </Button>
        <Button
          variant={activeTab === "no-show" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("no-show")}
          className="flex-1"
        >
          No-Shows ({unacknowledgedNoShowAlerts.length})
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("settings")}
          className="flex-1"
        >
          Settings
        </Button>
      </div>

      {/* Active Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {unacknowledgedGeoAlerts.length === 0 && unacknowledgedNoShowAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No active alerts at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Geo-Fence Alerts */}
              {unacknowledgedGeoAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertTypeIcon(alert.alertType)}
                        <div>
                          <h3 className="font-medium text-gray-900">{alert.userName}</h3>
                          <p className="text-sm text-gray-600">{alert.hospitalName}</p>
                          <p className="text-sm text-blue-600 capitalize">{alert.alertType} geo-fence</p>
                          {alert.distance > 0 && (
                            <p className="text-xs text-gray-500">{alert.distance}m away</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {format(alert.timestamp, 'HH:mm')}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate({ alertId: alert.id, type: 'geo-fence' })}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* No-Show Alerts */}
              {unacknowledgedNoShowAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-1" />
                        <div>
                          <h3 className="font-medium text-gray-900">{alert.userName}</h3>
                          <p className="text-sm text-gray-600">{alert.hospitalName}</p>
                          <p className="text-sm text-red-600">Missed scheduled visit</p>
                          <p className="text-xs text-gray-500">
                            {alert.missedDuration} minutes overdue
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate({ alertId: alert.id, type: 'no-show' })}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Geo-Fence Alerts Tab */}
      {activeTab === "geo-fence" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Geo-Fence Proximity Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentGeoAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getAlertTypeIcon(alert.alertType)}
                      <div>
                        <p className="font-medium">{alert.userName}</p>
                        <p className="text-sm text-gray-600">{alert.geoFenceName}</p>
                        <p className="text-xs text-gray-500">
                          {format(alert.timestamp, 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={alert.acknowledged ? "secondary" : "destructive"}>
                        {alert.acknowledged ? "Acknowledged" : "Active"}
                      </Badge>
                      {alert.distance > 0 && (
                        <span className="text-sm text-gray-500">{alert.distance}m</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No-Show Alerts Tab */}
      {activeTab === "no-show" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-red-600" />
                No-Show & Late Arrival Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentNoShowAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">{alert.userName}</p>
                        <p className="text-sm text-gray-600">{alert.hospitalName}</p>
                        <p className="text-xs text-gray-500">
                          Scheduled: {format(alert.scheduledTime, 'MMM dd, HH:mm')}
                        </p>
                        <p className="text-xs text-red-600">
                          {alert.missedDuration} minutes overdue
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant={alert.acknowledged ? "secondary" : "destructive"}>
                        {alert.acknowledged ? "Acknowledged" : "Active"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Geo-Fence Alert Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Geo-Fence Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="geo-fence-enabled">Enable Geo-Fence Alerts</Label>
                <Switch
                  id="geo-fence-enabled"
                  checked={settings.geoFenceAlerts.enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      geoFenceAlerts: { ...prev.geoFenceAlerts, enabled: checked }
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Approaching Alert Distance (meters)</Label>
                <Input
                  type="number"
                  value={settings.geoFenceAlerts.approachingRadius}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      geoFenceAlerts: { ...prev.geoFenceAlerts, approachingRadius: parseInt(e.target.value) }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Notification Methods</h4>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Sound Alerts
                  </Label>
                  <Switch
                    checked={settings.geoFenceAlerts.soundEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        geoFenceAlerts: { ...prev.geoFenceAlerts, soundEnabled: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Notifications
                  </Label>
                  <Switch
                    checked={settings.geoFenceAlerts.emailEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        geoFenceAlerts: { ...prev.geoFenceAlerts, emailEnabled: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    SMS Notifications
                  </Label>
                  <Switch
                    checked={settings.geoFenceAlerts.smsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        geoFenceAlerts: { ...prev.geoFenceAlerts, smsEnabled: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* No-Show Alert Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-red-600" />
                No-Show Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="no-show-enabled">Enable No-Show Alerts</Label>
                <Switch
                  id="no-show-enabled"
                  checked={settings.noShowAlerts.enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      noShowAlerts: { ...prev.noShowAlerts, enabled: checked }
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grace Period (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.noShowAlerts.gracePeriod}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        noShowAlerts: { ...prev.noShowAlerts, gracePeriod: parseInt(e.target.value) }
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Escalation Time (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.noShowAlerts.escalationTime}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        noShowAlerts: { ...prev.noShowAlerts, escalationTime: parseInt(e.target.value) }
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Notification Methods</h4>
                
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Sound Alerts
                  </Label>
                  <Switch
                    checked={settings.noShowAlerts.soundEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        noShowAlerts: { ...prev.noShowAlerts, soundEnabled: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Notifications
                  </Label>
                  <Switch
                    checked={settings.noShowAlerts.emailEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        noShowAlerts: { ...prev.noShowAlerts, emailEnabled: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    SMS Notifications
                  </Label>
                  <Switch
                    checked={settings.noShowAlerts.smsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        noShowAlerts: { ...prev.noShowAlerts, smsEnabled: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-600" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
                <Switch
                  id="quiet-hours-enabled"
                  checked={settings.generalSettings.quietHours.enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      generalSettings: {
                        ...prev.generalSettings,
                        quietHours: { ...prev.generalSettings.quietHours, enabled: checked }
                      }
                    }))
                  }
                />
              </div>

              {settings.generalSettings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={settings.generalSettings.quietHours.startTime}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          generalSettings: {
                            ...prev.generalSettings,
                            quietHours: { ...prev.generalSettings.quietHours, startTime: e.target.value }
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={settings.generalSettings.quietHours.endTime}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          generalSettings: {
                            ...prev.generalSettings,
                            quietHours: { ...prev.generalSettings.quietHours, endTime: e.target.value }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Alert Priority Level</Label>
                <Select
                  value={settings.generalSettings.priority}
                  onValueChange={(value: 'all' | 'high' | 'critical') =>
                    setSettings(prev => ({
                      ...prev,
                      generalSettings: { ...prev.generalSettings, priority: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alerts</SelectItem>
                    <SelectItem value="high">High Priority Only</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="batch-notifications">Batch Notifications</Label>
                <Switch
                  id="batch-notifications"
                  checked={settings.generalSettings.batchNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      generalSettings: { ...prev.generalSettings, batchNotifications: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end">
            <Button
              onClick={() => updateSettingsMutation.mutate(settings)}
              disabled={updateSettingsMutation.isPending}
            >
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}