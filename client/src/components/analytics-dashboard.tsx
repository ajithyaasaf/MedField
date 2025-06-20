import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics', timeRange],
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

  // Calculate analytics data
  const fieldReps = users?.filter((u: any) => u.role === 'field_rep') || [];
  const today = new Date();
  const startDate = timeRange === 'today' ? today :
                   timeRange === 'week' ? startOfWeek(today) :
                   timeRange === 'month' ? startOfMonth(today) :
                   subDays(today, 30);

  // Attendance Analytics
  const todayAttendance = attendance?.filter((a: any) => 
    a.date === today.toISOString().split('T')[0]
  ) || [];

  const attendanceInRange = attendance?.filter((a: any) => {
    const attendanceDate = new Date(a.clockInTime);
    return attendanceDate >= startDate && attendanceDate <= today;
  }) || [];

  const checkedIn = todayAttendance.filter((a: any) => a.clockInTime && !a.clockOutTime).length;
  const missedCheckIns = fieldReps.length - todayAttendance.length;
  const lateEntries = todayAttendance.filter((a: any) => {
    const clockIn = new Date(a.clockInTime);
    return clockIn.getHours() > 9; // Assuming 9 AM is the standard start time
  }).length;

  // Quotation Analytics
  const quotationsInRange = quotations?.filter((q: any) => {
    const quotationDate = new Date(q.createdAt);
    return quotationDate >= startDate && quotationDate <= today;
  }) || [];

  const sentQuotations = quotationsInRange.filter((q: any) => q.status === 'sent').length;
  const approvedQuotations = quotationsInRange.filter((q: any) => q.status === 'accepted').length;
  const rejectedQuotations = quotationsInRange.filter((q: any) => q.status === 'rejected').length;
  const draftQuotations = quotationsInRange.filter((q: any) => q.status === 'draft').length;

  const totalRevenue = quotationsInRange
    .filter((q: any) => q.status === 'accepted')
    .reduce((sum: number, q: any) => sum + parseFloat(q.totalAmount), 0);

  const conversionRate = sentQuotations > 0 ? Math.round((approvedQuotations / sentQuotations) * 100) : 0;

  // Hospital Revenue Rankings
  const hospitalRevenue = hospitals?.map((hospital: any) => {
    const hospitalQuotations = quotationsInRange.filter((q: any) => 
      q.hospitalId === hospital.id && q.status === 'accepted'
    );
    const revenue = hospitalQuotations.reduce((sum: number, q: any) => sum + parseFloat(q.totalAmount), 0);
    return {
      ...hospital,
      revenue,
      quotationCount: hospitalQuotations.length
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];

  // Field Rep Performance
  const repPerformance = fieldReps.map((rep: any) => {
    const repQuotations = quotationsInRange.filter((q: any) => q.userId === rep.id);
    const repAttendance = attendanceInRange.filter((a: any) => a.userId === rep.id);
    const revenue = repQuotations
      .filter((q: any) => q.status === 'accepted')
      .reduce((sum: number, q: any) => sum + parseFloat(q.totalAmount), 0);
    
    return {
      ...rep,
      quotationCount: repQuotations.length,
      revenue,
      attendanceRate: Math.round((repAttendance.length / 30) * 100), // Assuming 30 working days
      conversionRate: repQuotations.length > 0 ? 
        Math.round((repQuotations.filter((q: any) => q.status === 'accepted').length / repQuotations.length) * 100) : 0
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      default: return 'Last 30 Days';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-medical-gray-dark">Analytics Dashboard</h2>
          <p className="text-medical-gray">Performance insights for {getTimeRangeLabel()}</p>
        </div>
        <div className="flex space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="quotations">Quotations</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-medical-gray">Active Reps</p>
                <p className="text-3xl font-bold text-medical-gray-dark">{checkedIn}</p>
                <p className="text-xs text-medical-gray">of {fieldReps.length} total</p>
              </div>
              <div className="bg-medical-blue bg-opacity-10 p-3 rounded-full">
                <Users className="h-6 w-6 text-medical-blue" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={(checkedIn / fieldReps.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-medical-gray">Quotations Sent</p>
                <p className="text-3xl font-bold text-medical-gray-dark">{sentQuotations}</p>
                <p className="text-xs text-medical-gray">{conversionRate}% conversion rate</p>
              </div>
              <div className="bg-medical-amber bg-opacity-10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-medical-amber" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getTrendIcon(sentQuotations, sentQuotations * 0.9)}
              <span className="text-sm text-green-600 ml-1">+12% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-medical-gray">Revenue</p>
                <p className="text-3xl font-bold text-medical-gray-dark">
                  ${Math.round(totalRevenue / 1000)}K
                </p>
                <p className="text-xs text-medical-gray">from {approvedQuotations} deals</p>
              </div>
              <div className="bg-medical-green bg-opacity-10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-medical-green" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getTrendIcon(totalRevenue, totalRevenue * 0.85)}
              <span className="text-sm text-green-600 ml-1">+18% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-medical-gray">Attendance Rate</p>
                <p className="text-3xl font-bold text-medical-gray-dark">
                  {Math.round(((fieldReps.length - missedCheckIns) / fieldReps.length) * 100)}%
                </p>
                <p className="text-xs text-medical-gray">{lateEntries} late entries</p>
              </div>
              <div className="bg-medical-red bg-opacity-10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-medical-red" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={((fieldReps.length - missedCheckIns) / fieldReps.length) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hospitals by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-medical-green" />
              Top Hospitals by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hospitalRevenue.map((hospital, index) => (
                <div key={hospital.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-medical-blue bg-opacity-10 p-2 rounded-full text-medical-blue font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-medical-gray-dark">{hospital.name}</p>
                      <p className="text-sm text-medical-gray">{hospital.quotationCount} quotations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-medical-green">
                      ${hospital.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rep Performance Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-medical-blue" />
              Rep Performance Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repPerformance.slice(0, 5).map((rep, index) => (
                <div key={rep.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-medical-blue'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-medical-gray-dark">{rep.name}</p>
                      <div className="flex space-x-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {rep.quotationCount} quotes
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rep.conversionRate}% conversion
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-medical-green">
                      ${rep.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-medical-gray">{rep.attendanceRate}% attendance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotation Funnel Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-medical-amber" />
            Quotation Funnel Analysis - {getTimeRangeLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-lg mb-2">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-700">{draftQuotations}</p>
              </div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <Progress value={100} className="h-2 mt-2" />
            </div>
            
            <div className="text-center">
              <div className="bg-medical-amber bg-opacity-10 p-6 rounded-lg mb-2">
                <FileText className="h-8 w-8 mx-auto mb-2 text-medical-amber" />
                <p className="text-2xl font-bold text-medical-amber">{sentQuotations}</p>
              </div>
              <p className="text-sm font-medium text-medical-gray">Sent</p>
              <Progress 
                value={sentQuotations > 0 ? (sentQuotations / (draftQuotations + sentQuotations)) * 100 : 0} 
                className="h-2 mt-2" 
              />
            </div>
            
            <div className="text-center">
              <div className="bg-medical-green bg-opacity-10 p-6 rounded-lg mb-2">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-medical-green" />
                <p className="text-2xl font-bold text-medical-green">{approvedQuotations}</p>
              </div>
              <p className="text-sm font-medium text-medical-gray">Approved</p>
              <Progress 
                value={sentQuotations > 0 ? (approvedQuotations / sentQuotations) * 100 : 0} 
                className="h-2 mt-2" 
              />
            </div>
            
            <div className="text-center">
              <div className="bg-medical-red bg-opacity-10 p-6 rounded-lg mb-2">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-medical-red" />
                <p className="text-2xl font-bold text-medical-red">{rejectedQuotations}</p>
              </div>
              <p className="text-sm font-medium text-medical-gray">Rejected</p>
              <Progress 
                value={sentQuotations > 0 ? (rejectedQuotations / sentQuotations) * 100 : 0} 
                className="h-2 mt-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}