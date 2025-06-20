import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  HeartPulse, 
  Clock, 
  FileText, 
  MapPin, 
  Bell,
  User,
  LogOut,
  Plus,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Target,
  DollarSign,
  Navigation,
  Settings
} from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import QuotationBuilder from "@/components/quotation-builder";
import ScheduleManager from "@/components/schedule-manager";
import NotificationPanel from "@/components/notification-panel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useToast } from "@/hooks/use-toast";
import { checkGeoFenceCompliance, findNearestGeoFence } from "@/lib/geolocation";

export default function FieldRepDashboard() {
  const [showQuotationBuilder, setShowQuotationBuilder] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toast } = useToast();
  const { location, error: locationError } = useGeolocation();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: attendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/attendance'],
  });

  const { data: quotations } = useQuery({
    queryKey: ['/api/quotations'],
  });

  const { data: schedules } = useQuery({
    queryKey: ['/api/schedules'],
  });

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  const { data: geoFences } = useQuery({
    queryKey: ['/api/geo-fences'],
  });

  // Generate notifications based on app state
  useEffect(() => {
    const newNotifications = [];
    
    // Check for clock out reminder
    if (todayAttendance && !todayAttendance.clockOutTime) {
      const now = new Date();
      const clockInTime = new Date(todayAttendance.clockInTime);
      const hoursWorked = differenceInMinutes(now, clockInTime) / 60;
      
      if (hoursWorked >= 8) {
        newNotifications.push({
          id: 'clock-out-reminder',
          type: 'reminder',
          title: 'Clock Out Reminder',
          message: 'You have been clocked in for over 8 hours. Consider clocking out.',
          timestamp: new Date(),
          read: false,
        });
      }
    }

    // Check for upcoming quotation expiry
    if (quotations) {
      quotations.forEach((quote: any) => {
        if (quote.status === 'sent') {
          const createdDate = new Date(quote.createdAt);
          const daysSinceCreated = differenceInMinutes(new Date(), createdDate) / (60 * 24);
          
          if (daysSinceCreated >= 7) {
            newNotifications.push({
              id: `quote-expiry-${quote.id}`,
              type: 'alert',
              title: 'Quotation Follow-up',
              message: `Quotation ${quote.quotationNumber} needs follow-up - sent ${Math.floor(daysSinceCreated)} days ago`,
              timestamp: new Date(),
              read: false,
            });
          }
        }
      });
    }

    // Check geofence compliance
    if (location && geoFences && todayAttendance) {
      const compliance = checkGeoFenceCompliance(
        { latitude: location.latitude, longitude: location.longitude },
        geoFences
      );
      
      if (!compliance.isCompliant && compliance.nearestDistance > 200) {
        newNotifications.push({
          id: 'geofence-warning',
          type: 'alert',
          title: 'Location Alert',
          message: 'You are outside designated work areas. Manual approval may be required.',
          timestamp: new Date(),
          read: false,
        });
      }
    }

    setNotifications(newNotifications);
  }, [todayAttendance, quotations, location, geoFences]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { hospitalId?: number; latitude: number; longitude: number }) => {
      const response = await apiRequest("POST", "/api/attendance/clock-in", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clocked In",
        description: "Successfully clocked in for today.",
      });
      refetchAttendance();
    },
    onError: (error: any) => {
      toast({
        title: "Clock In Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number }) => {
      const response = await apiRequest("POST", "/api/attendance/clock-out", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clocked Out",
        description: "Successfully clocked out for today.",
      });
      refetchAttendance();
    },
    onError: (error: any) => {
      toast({
        title: "Clock Out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClockIn = () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location services to clock in.",
        variant: "destructive",
      });
      return;
    }

    clockInMutation.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleClockOut = () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location services to clock out.",
        variant: "destructive",
      });
      return;
    }

    clockOutMutation.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const todayAttendance = attendance?.find((record: any) => 
    record.date === new Date().toISOString().split('T')[0] && !record.clockOutTime
  );

  const isRep = user?.user?.role === 'field_rep';
  if (!isRep) return null;

  const recentQuotations = quotations?.slice(0, 3) || [];
  const todaySchedules = schedules?.filter((schedule: any) => 
    isToday(new Date(schedule.scheduledDate))
  ) || [];

  // Calculate performance metrics
  const thisMonthQuotations = quotations?.filter((q: any) => {
    const created = new Date(q.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }) || [];

  const acceptedQuotations = thisMonthQuotations.filter((q: any) => q.status === 'accepted');
  const totalRevenue = acceptedQuotations.reduce((sum: number, q: any) => sum + parseFloat(q.totalAmount), 0);
  const conversionRate = thisMonthQuotations.length > 0 ? Math.round((acceptedQuotations.length / thisMonthQuotations.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-medical-gray-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <HeartPulse className="h-6 w-6 text-medical-blue" />
              <h1 className="text-xl font-bold text-medical-gray-dark">MedField Pro</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-medical-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-medical-gray" />
                <span className="text-sm font-medium text-medical-gray-dark">
                  {user?.user?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto bg-white min-h-screen md:max-w-7xl md:px-8 md:py-6">
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
            <div className="w-full max-w-md">
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={(id) => {
                  setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                }}
                onDismiss={(id) => {
                  setNotifications(prev => prev.filter(n => n.id !== id));
                }}
                className="shadow-xl"
              />
              <Button
                variant="ghost"
                className="mt-2 w-full text-white hover:bg-white hover:bg-opacity-20"
                onClick={() => setShowNotifications(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
        {/* Status Header */}
        <div className="bg-gradient-to-r from-medical-blue to-medical-blue-dark text-white p-6 md:rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Welcome back, {user?.user?.name?.split(' ')[0]}!</h2>
              <p className="text-blue-100 text-sm">
                Field Representative • Territory: {user?.user?.territory}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Status</div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  todayAttendance ? 'bg-medical-green animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="font-medium">
                  {todayAttendance ? 'Clocked In' : 'Clocked Out'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Error Alert */}
        {locationError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>
                Location access is required for attendance tracking. Please enable location services.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Performance Dashboard */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-medical-gray-dark mb-4">This Month's Performance</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-blue">{thisMonthQuotations.length}</div>
                <div className="text-sm text-medical-gray">Quotations</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-green">{conversionRate}%</div>
                <div className="text-sm text-medical-gray">Conversion</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-amber">${Math.round(totalRevenue / 1000)}K</div>
                <div className="text-sm text-medical-gray">Revenue</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={todayAttendance ? handleClockOut : handleClockIn}
              disabled={clockInMutation.isPending || clockOutMutation.isPending || !location}
              className={`p-4 h-auto flex flex-col ${
                todayAttendance 
                  ? 'bg-medical-red hover:bg-red-600' 
                  : 'bg-medical-green hover:bg-medical-green-dark'
              }`}
            >
              <Clock className="mb-2 h-6 w-6" />
              <span className="text-sm">{todayAttendance ? 'Clock Out' : 'Clock In'}</span>
              {todayAttendance && (
                <span className="text-xs opacity-80 mt-1">
                  Since {format(new Date(todayAttendance.clockInTime), 'h:mm a')}
                </span>
              )}
            </Button>
            
            <Button
              onClick={() => setShowQuotationBuilder(true)}
              className="bg-medical-blue hover:bg-medical-blue-dark p-4 h-auto flex flex-col"
            >
              <Plus className="mb-2 h-6 w-6" />
              <span className="text-sm">New Quote</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => setShowScheduleManager(true)}
              className="p-4 h-auto flex flex-col border-medical-blue text-medical-blue hover:bg-medical-blue hover:text-white"
            >
              <Calendar className="mb-2 h-6 w-6" />
              <span className="text-sm">Schedule</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col border-medical-gray text-medical-gray hover:bg-medical-gray hover:text-white"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Reports feature will be available soon.",
                });
              }}
            >
              <TrendingUp className="mb-2 h-6 w-6" />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Today's Schedule</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-medical-blue"
              onClick={() => setShowScheduleManager(true)}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {todaySchedules.length > 0 ? todaySchedules.map((schedule: any) => {
              const hospital = hospitals?.find((h: any) => h.id === schedule.hospitalId);
              return (
                <div key={schedule.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-medical-blue">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-medical-gray-dark">{hospital?.name}</h4>
                      <p className="text-sm text-medical-gray">{hospital?.address}</p>
                      <p className="text-sm text-medical-gray mt-1">
                        <Clock className="inline w-4 h-4 mr-1" />
                        {format(new Date(schedule.scheduledDate), 'h:mm a')}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-medical-blue">
                      {schedule.purpose?.replace('_', ' ') || 'Visit'}
                    </Badge>
                  </div>
                  {schedule.notes && (
                    <p className="text-xs text-medical-gray mt-2">{schedule.notes}</p>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-8 text-medical-gray">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled visits for today</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-medical-blue text-medical-blue"
                  onClick={() => setShowScheduleManager(true)}
                >
                  Schedule a Visit
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Recent Quotations</h3>
            <Button variant="ghost" size="sm" className="text-medical-blue">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentQuotations.length > 0 ? recentQuotations.map((quotation: any) => {
              const hospital = hospitals?.find((h: any) => h.id === quotation.hospitalId);
              return (
                <div key={quotation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-medical-gray-dark">{quotation.quotationNumber}</h4>
                      <p className="text-sm text-medical-gray">{hospital?.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        quotation.status === 'accepted' ? 'default' : 
                        quotation.status === 'sent' ? 'secondary' : 'outline'
                      } className={
                        quotation.status === 'accepted' ? 'bg-medical-green' :
                        quotation.status === 'sent' ? 'bg-medical-amber' : ''
                      }>
                        {quotation.status}
                      </Badge>
                      <p className="text-lg font-bold text-medical-gray-dark mt-1">
                        ${parseFloat(quotation.totalAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-medical-gray">
                    Created {format(new Date(quotation.createdAt), 'MMM d, h:mm a')}
                  </p>
                  {quotation.notes && (
                    <p className="text-xs text-medical-gray mt-2">{quotation.notes}</p>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-8 text-medical-gray">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent quotations</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-medical-blue text-medical-blue"
                  onClick={() => setShowQuotationBuilder(true)}
                >
                  Create Quotation
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Location Status */}
        {location && (
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-medical-gray-dark mb-4">Current Location</h3>
            <div className="flex items-center space-x-3">
              <div className="bg-medical-green bg-opacity-10 p-3 rounded-full">
                <Navigation className="h-6 w-6 text-medical-green" />
              </div>
              <div>
                <p className="font-medium text-medical-gray-dark">Location Services Active</p>
                <p className="text-sm text-medical-gray">
                  Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-medical-gray">
                  Accuracy: ±{location.accuracy}m
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuotationBuilder && (
        <QuotationBuilder
          onClose={() => setShowQuotationBuilder(false)}
          onSuccess={() => {
            setShowQuotationBuilder(false);
            toast({
              title: "Success",
              description: "Quotation created successfully.",
            });
          }}
        />
      )}

      {showScheduleManager && (
        <ScheduleManager
          onClose={() => setShowScheduleManager(false)}
          hospitals={hospitals || []}
        />
      )}
    </div>
  );
}
