import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  HeartPulse, 
  Clock, 
  FileText, 
  MapPin, 
  Bell,
  User,
  LogOut,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import QuotationBuilder from "@/components/quotation-builder";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useToast } from "@/hooks/use-toast";

export default function FieldRepDashboard() {
  const [showQuotationBuilder, setShowQuotationBuilder] = useState(false);
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
    new Date(schedule.scheduledDate).toDateString() === new Date().toDateString()
  ) || [];

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
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 bg-medical-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
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

        {/* Quick Actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={todayAttendance ? handleClockOut : handleClockIn}
              disabled={clockInMutation.isPending || clockOutMutation.isPending || !location}
              className={`p-4 h-auto flex-col ${
                todayAttendance 
                  ? 'bg-medical-red hover:bg-red-600' 
                  : 'bg-medical-green hover:bg-medical-green-dark'
              }`}
            >
              <Clock className="mb-2 text-xl" />
              {todayAttendance ? 'Clock Out' : 'Clock In'}
            </Button>
            
            <Button
              onClick={() => setShowQuotationBuilder(true)}
              className="bg-medical-blue hover:bg-medical-blue-dark p-4 h-auto flex-col"
            >
              <Plus className="mb-2 text-xl" />
              New Quote
            </Button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-medical-gray-dark mb-4">Today's Schedule</h3>
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
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                    <Badge variant={schedule.status === 'confirmed' ? 'default' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-medical-gray">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled visits for today</p>
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
            {recentQuotations.length > 0 ? recentQuotations.map((quote: any) => {
              const hospital = hospitals?.find((h: any) => h.id === quote.hospitalId);
              return (
                <Card key={quote.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-medical-gray-dark">{quote.quotationNumber}</h4>
                        <p className="text-sm text-medical-gray">{hospital?.name}</p>
                      </div>
                      <Badge variant={
                        quote.status === 'accepted' ? 'default' :
                        quote.status === 'sent' ? 'secondary' :
                        quote.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {quote.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-medical-gray">${parseFloat(quote.totalAmount).toLocaleString()}</span>
                      <span className="text-medical-gray">
                        {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-8 text-medical-gray">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quotations yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowQuotationBuilder(true)}
                >
                  Create Your First Quote
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quotation Builder Modal */}
      {showQuotationBuilder && (
        <QuotationBuilder
          onClose={() => setShowQuotationBuilder(false)}
          onSuccess={() => {
            setShowQuotationBuilder(false);
            queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
          }}
        />
      )}
    </div>
  );
}
