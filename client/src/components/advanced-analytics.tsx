import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Calendar,
  Target,
  Award,
  MapPin,
  Clock,
  Download,
  Filter
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface AdvancedAnalyticsProps {
  className?: string;
}

interface AttendanceMetrics {
  totalCheckIns: number;
  onTimeCheckIns: number;
  lateCheckIns: number;
  missedCheckIns: number;
  averageHoursWorked: number;
  attendanceRate: number;
  byDate: Array<{
    date: string;
    checkIns: number;
    onTime: number;
    late: number;
    missed: number;
  }>;
  byUser: Array<{
    userId: number;
    userName: string;
    checkIns: number;
    attendanceRate: number;
    avgHours: number;
  }>;
  byRegion: Array<{
    region: string;
    totalReps: number;
    activeReps: number;
    attendanceRate: number;
  }>;
}

interface RevenueMetrics {
  totalRevenue: number;
  forecastedRevenue: number;
  growthRate: number;
  avgDealSize: number;
  byRegion: Array<{
    region: string;
    revenue: number;
    growth: number;
    dealCount: number;
  }>;
  byRep: Array<{
    userId: number;
    userName: string;
    revenue: number;
    dealCount: number;
    conversionRate: number;
  }>;
  forecast: Array<{
    month: string;
    projected: number;
    conservative: number;
    optimistic: number;
  }>;
}

interface QuotationFunnel {
  totalQuotations: number;
  draftCount: number;
  sentCount: number;
  approvedCount: number;
  rejectedCount: number;
  conversionRate: number;
  avgTimeToApproval: number;
  byStage: Array<{
    stage: string;
    count: number;
    percentage: number;
    avgDaysInStage: number;
  }>;
  topHospitals: Array<{
    hospitalId: number;
    hospitalName: string;
    quotationCount: number;
    totalValue: number;
    conversionRate: number;
  }>;
}

export default function AdvancedAnalytics({ className }: AdvancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedRep, setSelectedRep] = useState("all");

  const { data: attendanceMetrics } = useQuery({
    queryKey: ['/api/analytics/attendance', timeRange, selectedRegion, selectedRep],
  });

  const { data: revenueMetrics } = useQuery({
    queryKey: ['/api/analytics/revenue', timeRange, selectedRegion, selectedRep],
  });

  const { data: quotationFunnel } = useQuery({
    queryKey: ['/api/analytics/quotation-funnel', timeRange, selectedRegion, selectedRep],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const mockAttendanceMetrics: AttendanceMetrics = {
    totalCheckIns: 145,
    onTimeCheckIns: 128,
    lateCheckIns: 17,
    missedCheckIns: 8,
    averageHoursWorked: 7.4,
    attendanceRate: 94.5,
    byDate: eachDayOfInterval({
      start: subDays(new Date(), 30),
      end: new Date()
    }).map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      checkIns: Math.floor(Math.random() * 8) + 2,
      onTime: Math.floor(Math.random() * 6) + 2,
      late: Math.floor(Math.random() * 2),
      missed: Math.floor(Math.random() * 1)
    })),
    byUser: users?.slice(0, 5).map((user: any) => ({
      userId: user.id,
      userName: user.name,
      checkIns: Math.floor(Math.random() * 25) + 15,
      attendanceRate: Math.floor(Math.random() * 20) + 80,
      avgHours: Math.round((Math.random() * 2 + 6.5) * 10) / 10
    })) || [],
    byRegion: [
      { region: "Downtown", totalReps: 8, activeReps: 7, attendanceRate: 87.5 },
      { region: "North District", totalReps: 6, activeReps: 6, attendanceRate: 100 },
      { region: "South Zone", totalReps: 5, activeReps: 4, attendanceRate: 80 }
    ]
  };

  const mockRevenueMetrics: RevenueMetrics = {
    totalRevenue: 145000,
    forecastedRevenue: 180000,
    growthRate: 24.1,
    avgDealSize: 15800,
    byRegion: [
      { region: "Downtown", revenue: 65000, growth: 18.5, dealCount: 12 },
      { region: "North District", revenue: 48000, growth: 31.2, dealCount: 8 },
      { region: "South Zone", revenue: 32000, growth: 15.8, dealCount: 6 }
    ],
    byRep: users?.slice(0, 5).map((user: any) => ({
      userId: user.id,
      userName: user.name,
      revenue: Math.floor(Math.random() * 30000) + 15000,
      dealCount: Math.floor(Math.random() * 8) + 3,
      conversionRate: Math.floor(Math.random() * 40) + 60
    })) || [],
    forecast: [
      { month: "Jan", projected: 45000, conservative: 38000, optimistic: 52000 },
      { month: "Feb", projected: 48000, conservative: 42000, optimistic: 55000 },
      { month: "Mar", projected: 52000, conservative: 45000, optimistic: 60000 },
      { month: "Apr", projected: 55000, conservative: 48000, optimistic: 63000 },
      { month: "May", projected: 58000, conservative: 51000, optimistic: 67000 },
      { month: "Jun", projected: 62000, conservative: 54000, optimistic: 71000 }
    ]
  };

  const mockQuotationFunnel: QuotationFunnel = {
    totalQuotations: 89,
    draftCount: 23,
    sentCount: 34,
    approvedCount: 21,
    rejectedCount: 11,
    conversionRate: 61.8,
    avgTimeToApproval: 8.5,
    byStage: [
      { stage: "Draft", count: 23, percentage: 25.8, avgDaysInStage: 2.3 },
      { stage: "Sent", count: 34, percentage: 38.2, avgDaysInStage: 5.7 },
      { stage: "Under Review", count: 11, percentage: 12.4, avgDaysInStage: 3.2 },
      { stage: "Approved", count: 21, percentage: 23.6, avgDaysInStage: 8.5 }
    ],
    topHospitals: [
      { hospitalId: 1, hospitalName: "St. Mary's Hospital", quotationCount: 15, totalValue: 95000, conversionRate: 73.3 },
      { hospitalId: 2, hospitalName: "General Medical Center", quotationCount: 12, totalValue: 78000, conversionRate: 66.7 },
      { hospitalId: 3, hospitalName: "City Health Complex", quotationCount: 9, totalValue: 52000, conversionRate: 55.6 },
      { hospitalId: 4, hospitalName: "Regional Hospital", quotationCount: 8, totalValue: 48000, conversionRate: 62.5 }
    ]
  };

  const currentAttendance = attendanceMetrics || mockAttendanceMetrics;
  const currentRevenue = revenueMetrics || mockRevenueMetrics;
  const currentFunnel = quotationFunnel || mockQuotationFunnel;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Comprehensive insights and forecasting</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="downtown">Downtown</SelectItem>
              <SelectItem value="north">North District</SelectItem>
              <SelectItem value="south">South Zone</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Forecasting</TabsTrigger>
          <TabsTrigger value="quotations">Quotation Funnel</TabsTrigger>
        </TabsList>

        {/* Attendance Analytics */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
                    <p className="text-3xl font-bold text-gray-900">{currentAttendance.totalCheckIns}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12.5% from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{currentAttendance.attendanceRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${currentAttendance.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                    <p className="text-3xl font-bold text-gray-900">{currentAttendance.averageHoursWorked}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">Target: 8.0 hrs</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Late Check-ins</p>
                    <p className="text-3xl font-bold text-gray-900">{currentAttendance.lateCheckIns}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">-5.2% improvement</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance by Region */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAttendance.byRegion.map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-gray-600">{region.activeReps}/{region.totalReps} active reps</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{region.attendanceRate}%</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${region.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Reps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAttendance.byUser.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-gray-600">{user.checkIns} check-ins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{user.attendanceRate}%</p>
                      <p className="text-sm text-gray-600">{user.avgHours} hrs avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecasting */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${currentRevenue.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+{currentRevenue.growthRate}% growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Forecasted</p>
                    <p className="text-3xl font-bold text-gray-900">${currentRevenue.forecastedRevenue.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">Next 30 days</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                    <p className="text-3xl font-bold text-gray-900">${currentRevenue.avgDealSize.toLocaleString()}</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+8.3% vs target</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                    <p className="text-3xl font-bold text-gray-900">${(currentRevenue.totalRevenue * 1.8).toLocaleString()}</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="outline">Q1 Target</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>6-Month Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRevenue.forecast.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 text-center font-medium">{month.month}</div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-100 rounded">
                          <div 
                            className="absolute left-0 top-0 h-8 bg-red-200 rounded"
                            style={{ width: `${(month.conservative / 71000) * 100}%` }}
                          />
                          <div 
                            className="absolute left-0 top-0 h-8 bg-blue-500 rounded"
                            style={{ width: `${(month.projected / 71000) * 100}%` }}
                          />
                          <div 
                            className="absolute left-0 top-0 h-8 bg-green-200 rounded"
                            style={{ width: `${(month.optimistic / 71000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">${month.projected.toLocaleString()}</p>
                      <div className="flex space-x-2 text-xs">
                        <span className="text-red-600">${month.conservative.toLocaleString()}</span>
                        <span className="text-green-600">${month.optimistic.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Revenue Regions */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRevenue.byRegion.map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-gray-600">{region.dealCount} deals closed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${region.revenue.toLocaleString()}</p>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">+{region.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotation Funnel Analysis */}
        <TabsContent value="quotations" className="space-y-6">
          {/* Funnel KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                    <p className="text-3xl font-bold text-gray-900">{currentFunnel.totalQuotations}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">This period</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{currentFunnel.conversionRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${currentFunnel.conversionRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Time to Approval</p>
                    <p className="text-3xl font-bold text-gray-900">{currentFunnel.avgTimeToApproval}</p>
                    <p className="text-sm text-gray-600">days</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="outline">Target: 7 days</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-3xl font-bold text-gray-900">{currentFunnel.approvedCount}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+15.3% vs last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Stages */}
          <Card>
            <CardHeader>
              <CardTitle>Quotation Funnel Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentFunnel.byStage.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{stage.stage}</p>
                          <p className="text-sm text-gray-600">{stage.avgDaysInStage} days avg</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{stage.count}</p>
                        <p className="text-sm text-gray-600">{stage.percentage}%</p>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${stage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Hospitals by Quotations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Hospitals by Quotation Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentFunnel.topHospitals.map((hospital, index) => (
                  <div key={hospital.hospitalId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{hospital.hospitalName}</p>
                        <p className="text-sm text-gray-600">{hospital.quotationCount} quotations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${hospital.totalValue.toLocaleString()}</p>
                      <Badge variant="secondary">{hospital.conversionRate}% conversion</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}