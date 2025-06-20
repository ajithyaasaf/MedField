import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin,
  TrendingUp,
  BarChart3,
  X,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ReportsGeneratorProps {
  onClose: () => void;
}

interface ReportConfig {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
}

export default function ReportsGenerator({ onClose }: ReportsGeneratorProps) {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    userId: '',
    hospitalId: '',
    territory: '',
    status: '',
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest('POST', '/api/reports/generate', config);
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${variables.type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Report Generated',
        description: 'Your report has been downloaded successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    },
  });

  const reportTypes: ReportConfig[] = [
    {
      type: 'attendance',
      title: 'Attendance Report',
      description: 'Detailed attendance records with clock-in/out times, locations, and compliance status',
      icon: <Calendar className="h-6 w-6 text-medical-blue" />,
      fields: ['user', 'date', 'clockIn', 'clockOut', 'location', 'geoFenceCompliance', 'hoursWorked', 'overtime']
    },
    {
      type: 'quotations',
      title: 'Quotation Report',
      description: 'Comprehensive quotation analysis with conversion rates and revenue breakdown',
      icon: <FileText className="h-6 w-6 text-medical-amber" />,
      fields: ['quotationNumber', 'hospital', 'user', 'products', 'amount', 'status', 'createdDate', 'responseTime']
    },
    {
      type: 'revenue',
      title: 'Revenue Report',
      description: 'Revenue analysis by rep, hospital, and time period with forecasting',
      icon: <DollarSign className="h-6 w-6 text-medical-green" />,
      fields: ['period', 'totalRevenue', 'hospital', 'user', 'territory', 'growth', 'forecast', 'targets']
    },
    {
      type: 'performance',
      title: 'Performance Report',
      description: 'Field representative performance metrics and KPI analysis',
      icon: <TrendingUp className="h-6 w-6 text-medical-blue" />,
      fields: ['user', 'territory', 'quotationsCount', 'conversionRate', 'revenue', 'attendanceRate', 'ranking']
    },
    {
      type: 'hospital',
      title: 'Hospital Analysis',
      description: 'Hospital engagement and revenue analysis with growth opportunities',
      icon: <MapPin className="h-6 w-6 text-medical-red" />,
      fields: ['hospital', 'contactPerson', 'quotationsReceived', 'totalRevenue', 'lastVisit', 'status', 'potential']
    },
    {
      type: 'compliance',
      title: 'Compliance Report',
      description: 'Geo-fence compliance, audit trails, and security monitoring',
      icon: <BarChart3 className="h-6 w-6 text-medical-amber" />,
      fields: ['user', 'location', 'timestamp', 'compliance', 'violations', 'approvals', 'auditTrail']
    }
  ];

  const fieldReps = users?.filter((u: any) => u.role === 'field_rep') || [];
  const territories = [...new Set(fieldReps.map((rep: any) => rep.territory).filter(Boolean))];

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast({
        title: 'Report Type Required',
        description: 'Please select a report type to generate.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        title: 'Fields Required',
        description: 'Please select at least one field to include in the report.',
        variant: 'destructive',
      });
      return;
    }

    const config = {
      type: selectedReport,
      dateRange,
      fields: selectedFields,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      ),
      format: 'pdf'
    };

    generateReportMutation.mutate(config);
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const selectedReportConfig = reportTypes.find(r => r.type === selectedReport);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-medical-blue" />
              <span>Reports & Analytics Generator</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Generate comprehensive reports for attendance, quotations, revenue, and performance analysis
          </p>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-gray-dark">Select Report Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((report) => (
                <Card 
                  key={report.type}
                  className={`cursor-pointer transition-all ${
                    selectedReport === report.type 
                      ? 'ring-2 ring-medical-blue bg-medical-blue bg-opacity-5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedReport(report.type);
                    setSelectedFields([]);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        {report.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-medical-gray-dark">{report.title}</h4>
                        <p className="text-sm text-medical-gray mt-1">{report.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedReportConfig && (
            <>
              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-medical-gray-dark">Date Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                      endDate: format(new Date(), 'yyyy-MM-dd')
                    })}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                      endDate: format(new Date(), 'yyyy-MM-dd')
                    })}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                    })}
                  >
                    This Month
                  </Button>
                </div>
              </div>

              {/* Field Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-medical-gray-dark">Include Fields</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedReportConfig.fields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => handleFieldToggle(field)}
                      />
                      <Label htmlFor={field} className="text-sm capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFields(selectedReportConfig.fields)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFields([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-medical-gray-dark">Filters (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="userFilter">Field Representative</Label>
                    <Select value={filters.userId} onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All reps" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Representatives</SelectItem>
                        {fieldReps.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id.toString()}>
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="hospitalFilter">Hospital</Label>
                    <Select value={filters.hospitalId} onValueChange={(value) => setFilters(prev => ({ ...prev, hospitalId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All hospitals" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Hospitals</SelectItem>
                        {hospitals?.map((hospital: any) => (
                          <SelectItem key={hospital.id} value={hospital.id.toString()}>
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="territoryFilter">Territory</Label>
                    <Select value={filters.territory} onValueChange={(value) => setFilters(prev => ({ ...prev, territory: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All territories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Territories</SelectItem>
                        {territories.map((territory) => (
                          <SelectItem key={territory} value={territory}>
                            {territory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedReport === 'quotations' && (
                    <div>
                      <Label htmlFor="statusFilter">Status</Label>
                      <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Statuses</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending || !selectedReport || selectedFields.length === 0}
                  className="bg-medical-blue hover:bg-medical-blue-dark"
                >
                  {generateReportMutation.isPending ? (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}