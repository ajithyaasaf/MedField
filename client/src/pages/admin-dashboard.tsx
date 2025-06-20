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
import ManualAttendanceApproval from "@/components/manual-attendance-approval";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import AdvancedAnalytics from "@/components/advanced-analytics";
import ReportsGenerator from "@/components/reports-generator";
import SystemSettings from "@/components/system-settings";
import ActivityFeed from "@/components/activity-feed";
import DocumentManager from "@/components/document-manager";
import OfflineManager from "@/components/offline-manager";
import AuditCompliance from "@/components/audit-compliance";
import QuotationManagement from "@/components/quotation-management";
import SmartNotifications from "@/components/smart-notifications";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showGeoFenceManager, setShowGeoFenceManager] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAttendanceApproval, setShowAttendanceApproval] = useState(false);
  const [showReportsGenerator, setShowReportsGenerator] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [showQuotationManagement, setShowQuotationManagement] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showSmartNotifications, setShowSmartNotifications] = useState(false);
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

  // Safe data handling with proper array checks
  const safeUsers = Array.isArray(users) ? users : [];
  const safeQuotations = Array.isArray(quotations) ? quotations : [];
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeHospitals = Array.isArray(hospitals) ? hospitals : [];
  const safeGeoFences = Array.isArray(geoFences) ? geoFences : [];

  // Calculate KPIs with safe data
  const activeReps = safeUsers.filter((u: any) => u.role === 'field_rep' && u.isActive);
  const pendingQuotes = safeQuotations.filter((q: any) => q.status === 'sent');
  const todayAttendance = safeAttendance.filter((a: any) => 
    a.date === new Date().toISOString().split('T')[0]
  );
  
  const monthlyRevenue = safeQuotations.reduce((sum: number, q: any) => {
    if (q.status === 'accepted' && new Date(q.createdAt).getMonth() === new Date().getMonth()) {
      return sum + parseFloat(q.totalAmount || '0');
    }
    return sum;
  }, 0);

  const conversionRate = safeQuotations.length > 0 
    ? Math.round((safeQuotations.filter((q: any) => q.status === 'accepted').length / safeQuotations.length) * 100)
    : 0;

  // Recent activity with safe data handling
  const recentActivity = [
    ...todayAttendance.slice(0, 3).map((a: any) => ({
      type: 'clock-in',
      user: safeUsers.find((u: any) => u.id === a.userId)?.name,
      time: a.clockInTime,
      hospital: safeHospitals.find((h: any) => h.id === a.hospitalId)?.name
    })),
    ...safeQuotations.slice(0, 2).map((q: any) => ({
      type: 'quotation',
      user: safeUsers.find((u: any) => u.id === q.userId)?.name,
      time: q.createdAt,
      quotationNumber: q.quotationNumber
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MedField Pro
                </h1>
                <p className="text-xs text-slate-500">Administrative Dashboard</p>
              </div>
              <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                Admin Portal
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{user?.user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.user?.role}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Dashboard Header */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
              <p className="text-slate-600">Monitor field operations, manage quotations, and track performance</p>
            </div>
            <div className="text-sm text-slate-500">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-blue-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'overview' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'analytics' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'documents' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('offline')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'offline' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              Offline
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'audit' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              Audit & Compliance
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard />
        )}

        {/* Document Management */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-medical-gray-dark">Document Management</h2>
                <p className="text-medical-gray">Manage contracts, approvals, certificates, and other documents</p>
              </div>
            </div>
            <DocumentManager onClose={() => setActiveTab('overview')} />
          </div>
        )}

        {/* Offline Management */}
        {activeTab === "offline" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-medical-gray-dark">Offline Management</h2>
                <p className="text-medical-gray">Monitor offline data sync and cached information</p>
              </div>
            </div>
            <OfflineManager />
          </div>
        )}

        {/* Audit & Compliance */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-medical-gray-dark">Audit & Compliance</h2>
                <p className="text-medical-gray">Monitor system security, user actions, and compliance violations</p>
              </div>
            </div>
            <AuditCompliance />
          </div>
        )}

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
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
                    onClick={() => setShowAttendanceApproval(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-3" />
                    Attendance Approvals
                  </Button>
                  <Button
                    className="w-full bg-medical-red hover:bg-red-600 justify-start"
                    onClick={() => setShowReportsGenerator(true)}
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    Generate Reports
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white justify-start"
                    onClick={() => setShowAdvancedAnalytics(true)}
                  >
                    <TrendingUp className="w-4 h-4 mr-3" />
                    Advanced Analytics
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                    onClick={() => setShowQuotationManagement(true)}
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    Quotation Management
                  </Button>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start"
                    onClick={() => setShowSmartNotifications(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-3" />
                    Smart Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ActivityFeed />
          </div>
        </div>
        </>
        )}
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

      {showAttendanceApproval && (
        <ManualAttendanceApproval
          onClose={() => setShowAttendanceApproval(false)}
        />
      )}

      {showReportsGenerator && (
        <ReportsGenerator
          onClose={() => setShowReportsGenerator(false)}
        />
      )}

      {showSystemSettings && (
        <SystemSettings
          onClose={() => setShowSystemSettings(false)}
        />
      )}

      {showAdvancedAnalytics && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedAnalytics(false)}
                className="ml-4"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
            <AdvancedAnalytics />
          </div>
        </div>
      )}

      {showQuotationManagement && (
        <QuotationManagement
          onClose={() => setShowQuotationManagement(false)}
        />
      )}

      {showSmartNotifications && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Smart Notifications Dashboard</h1>
              <Button
                variant="outline"
                onClick={() => setShowSmartNotifications(false)}
                className="ml-4"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
            <SmartNotifications />
          </div>
        </div>
      )}
    </div>
  );
}
