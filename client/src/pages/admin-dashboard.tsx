import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HeartPulse,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  MapPin,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  User
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MapComponent from "@/components/ui/map";
import GeoFenceManager from "@/components/geo-fence-manager";
import UserManagement from "@/components/user-management";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showGeoFenceManager, setShowGeoFenceManager] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: quotations } = useQuery({
    queryKey: ['/api/quotations'],
  });

  const { data: attendance } = useQuery({
    queryKey: ['/api/attendance'],
  });

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  const { data: geoFences } = useQuery({
    queryKey: ['/api/geo-fences'],
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

  const approveQuotationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/quotations/${id}`, {
        status: "approved"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quotation Approved",
        description: "The quotation has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
    },
  });

  const rejectQuotationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/quotations/${id}`, {
        status: "rejected"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quotation Rejected",
        description: "The quotation has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
    },
  });

  const isAdmin = user?.user?.role === 'admin';
  if (!isAdmin) return null;

  // Calculate KPIs
  const activeReps = users?.filter((u: any) => u.role === 'field_rep' && u.isActive) || [];
  const pendingQuotes = quotations?.filter((q: any) => q.status === 'sent') || [];
  const todayAttendance = attendance?.filter((a: any) => 
    a.date === new Date().toISOString().split('T')[0]
  ) || [];
  
  const monthlyRevenue = quotations?.reduce((sum: number, q: any) => {
    if (q.status === 'accepted' && new Date(q.createdAt).getMonth() === new Date().getMonth()) {
      return sum + parseFloat(q.totalAmount);
    }
    return sum;
  }, 0) || 0;

  const conversionRate = quotations?.length > 0 
    ? Math.round((quotations.filter((q: any) => q.status === 'accepted').length / quotations.length) * 100)
    : 0;

  // Recent activity
  const recentActivity = [
    ...todayAttendance.slice(0, 3).map((a: any) => ({
      type: 'clock-in',
      user: users?.find((u: any) => u.id === a.userId)?.name,
      time: a.clockInTime,
      hospital: hospitals?.find((h: any) => h.id === a.hospitalId)?.name
    })),
    ...quotations?.slice(0, 2).map((q: any) => ({
      type: 'quotation',
      user: users?.find((u: any) => u.id === q.userId)?.name,
      time: q.createdAt,
      quotationNumber: q.quotationNumber
    })) || []
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-medical-gray-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <HeartPulse className="h-6 w-6 text-medical-blue" />
              <h1 className="text-xl font-bold text-medical-gray-dark">MedField Pro</h1>
              <Badge variant="secondary" className="ml-2">Admin</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-gray-dark">Admin Dashboard</h1>
          <p className="text-medical-gray mt-2">Monitor field operations, manage quotations, and track performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medical-gray">Active Reps</p>
                  <p className="text-3xl font-bold text-medical-gray-dark">{activeReps.length}</p>
                </div>
                <div className="bg-medical-green bg-opacity-10 p-3 rounded-full">
                  <Users className="text-medical-green text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-medical-green mr-1" />
                <span className="text-medical-green">8.2% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medical-gray">Pending Quotes</p>
                  <p className="text-3xl font-bold text-medical-gray-dark">{pendingQuotes.length}</p>
                </div>
                <div className="bg-medical-amber bg-opacity-10 p-3 rounded-full">
                  <FileText className="text-medical-amber text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-medical-gray">Awaiting approval</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medical-gray">Revenue (MTD)</p>
                  <p className="text-3xl font-bold text-medical-gray-dark">
                    ${Math.round(monthlyRevenue / 1000)}K
                  </p>
                </div>
                <div className="bg-medical-blue bg-opacity-10 p-3 rounded-full">
                  <DollarSign className="text-medical-blue text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-medical-green mr-1" />
                <span className="text-medical-green">12.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medical-gray">Conversion Rate</p>
                  <p className="text-3xl font-bold text-medical-gray-dark">{conversionRate}%</p>
                </div>
                <div className="bg-medical-green bg-opacity-10 p-3 rounded-full">
                  <TrendingUp className="text-medical-green text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-medical-green mr-1" />
                <span className="text-medical-green">5.4% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Live Map & Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Field Rep Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-medical-blue" />
                  Live Field Rep Locations
                </CardTitle>
                <p className="text-sm text-medical-gray">Real-time GPS tracking within defined geo-zones</p>
              </CardHeader>
              <CardContent>
                <MapComponent
                  geoFences={geoFences || []}
                  hospitals={hospitals || []}
                  attendance={todayAttendance}
                  users={users || []}
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        activity.type === 'clock-in' 
                          ? 'bg-medical-blue bg-opacity-10' 
                          : 'bg-medical-green bg-opacity-10'
                      }`}>
                        {activity.type === 'clock-in' ? (
                          <Clock className="text-medical-blue text-sm" />
                        ) : (
                          <FileText className="text-medical-green text-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-medical-gray-dark">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.type === 'clock-in' 
                            ? `clocked in at ${activity.hospital}`
                            : `submitted quotation ${activity.quotationNumber}`
                          }
                        </p>
                        <p className="text-xs text-medical-gray">
                          {format(new Date(activity.time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <p className="text-sm text-medical-gray">Quotations requiring review</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingQuotes.slice(0, 3).map((quote: any) => {
                    const hospital = hospitals?.find((h: any) => h.id === quote.hospitalId);
                    const rep = users?.find((u: any) => u.id === quote.userId);
                    return (
                      <div key={quote.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-medical-gray-dark">{quote.quotationNumber}</h4>
                            <p className="text-sm text-medical-gray">{hospital?.name}</p>
                          </div>
                          <span className="text-lg font-bold text-medical-gray-dark">
                            ${parseFloat(quote.totalAmount).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-medical-gray mb-3">
                          Submitted by {rep?.name} • {format(new Date(quote.createdAt), 'MMM d, h:mm a')}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-medical-green hover:bg-medical-green-dark"
                            onClick={() => approveQuotationMutation.mutate(quote.id)}
                            disabled={approveQuotationMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => rejectQuotationMutation.mutate(quote.id)}
                            disabled={rejectQuotationMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {pendingQuotes.length === 0 && (
                    <div className="text-center py-8 text-medical-gray">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending approvals</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-medical-blue hover:bg-medical-blue-dark justify-start"
                    onClick={() => setShowGeoFenceManager(true)}
                  >
                    <MapPin className="w-4 h-4 mr-3" />
                    Manage Geo-Fences
                  </Button>
                  <Button
                    className="w-full bg-medical-green hover:bg-medical-green-dark justify-start"
                    onClick={() => setShowUserManagement(true)}
                  >
                    <Users className="w-4 h-4 mr-3" />
                    User Management
                  </Button>
                  <Button
                    className="w-full bg-medical-amber hover:bg-yellow-600 justify-start"
                    onClick={() => {}}
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    Generate Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Geo-Fence Manager Modal */}
      {showGeoFenceManager && (
        <GeoFenceManager
          onClose={() => setShowGeoFenceManager(false)}
          hospitals={hospitals || []}
          geoFences={geoFences || []}
        />
      )}

      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
          hospitals={hospitals || []}
        />
      )}
    </div>
  );
}
