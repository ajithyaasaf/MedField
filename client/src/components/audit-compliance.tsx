import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditComplianceProps {
  className?: string;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: number;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  compliance: 'compliant' | 'violation' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceMetrics {
  totalLogs: number;
  compliantActions: number;
  violations: number;
  warnings: number;
  criticalIssues: number;
  complianceRate: number;
}

export default function AuditCompliance({ className }: AuditComplianceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['/api/audit/logs', dateRange, severityFilter, complianceFilter],
  });

  const { data: complianceMetrics } = useQuery({
    queryKey: ['/api/audit/metrics', dateRange],
  });

  // Mock audit data for demonstration
  const mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      userId: 3,
      userRole: 'field_rep',
      action: 'CLOCK_IN',
      resource: 'attendance',
      resourceId: 'att_001',
      details: 'User clocked in at St. Mary\'s Hospital',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      location: {
        latitude: 40.7580,
        longitude: -73.9855,
        accuracy: 5
      },
      compliance: 'compliant',
      severity: 'low'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: 4,
      userRole: 'field_rep',
      action: 'CLOCK_IN_MANUAL_APPROVAL',
      resource: 'attendance',
      resourceId: 'att_002',
      details: 'User attempted to clock in outside geo-fence (150m from boundary)',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Android 12; Mobile)',
      location: {
        latitude: 40.7590,
        longitude: -73.9845,
        accuracy: 8
      },
      compliance: 'warning',
      severity: 'medium'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      userId: 1,
      userRole: 'admin',
      action: 'USER_CREATE',
      resource: 'users',
      resourceId: 'user_005',
      details: 'Created new field representative account',
      ipAddress: '10.0.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      compliance: 'compliant',
      severity: 'low'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      userId: 5,
      userRole: 'field_rep',
      action: 'LOCATION_TAMPERING_DETECTED',
      resource: 'security',
      details: 'Suspicious location data detected - GPS coordinates inconsistent with previous readings',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Android 12; Mobile)',
      location: {
        latitude: 0,
        longitude: 0,
        accuracy: 0
      },
      compliance: 'violation',
      severity: 'critical'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      userId: 3,
      userRole: 'field_rep',
      action: 'QUOTATION_SUBMIT',
      resource: 'quotations',
      resourceId: 'quo_001',
      details: 'Submitted quotation QUO-2024-001 for $45,000',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      compliance: 'compliant',
      severity: 'low'
    }
  ];

  const mockMetrics: ComplianceMetrics = {
    totalLogs: 150,
    compliantActions: 142,
    violations: 3,
    warnings: 5,
    criticalIssues: 1,
    complianceRate: 94.7
  };

  const logs = auditLogs || mockAuditLogs;
  const metrics = complianceMetrics || mockMetrics;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesCompliance = complianceFilter === 'all' || log.compliance === complianceFilter;
    
    return matchesSearch && matchesSeverity && matchesCompliance;
  });

  const getComplianceIcon = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'violation': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'violation': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Role', 'Action', 'Resource', 'Details', 'IP Address', 'Compliance', 'Severity'],
      ...filteredLogs.map(log => [
        format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        log.userId.toString(),
        log.userRole,
        log.action,
        log.resource,
        log.details,
        log.ipAddress,
        log.compliance,
        log.severity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics.complianceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-800">{metrics.totalLogs}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Violations</p>
                <p className="text-2xl font-bold text-red-600">{metrics.violations}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.warnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-medical-blue" />
              Audit Trail & Compliance Monitoring
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={exportAuditLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Compliance status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="violation">Violation</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Logs Table */}
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found matching your criteria</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getComplianceIcon(log.compliance)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <Badge className={getComplianceColor(log.compliance)}>
                            {log.compliance}
                          </Badge>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(log.timestamp, 'MMM d, H:mm')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium">User:</span> ID {log.userId} ({log.userRole})
                    </div>
                    <div>
                      <span className="font-medium">Resource:</span> {log.resource}
                      {log.resourceId && ` (${log.resourceId})`}
                    </div>
                    <div>
                      <span className="font-medium">IP:</span> {log.ipAddress}
                    </div>
                    {log.location && (
                      <div>
                        <span className="font-medium">Location:</span> 
                        {log.location.latitude.toFixed(4)}, {log.location.longitude.toFixed(4)}
                        {log.location.accuracy > 0 && ` (±${log.location.accuracy}m)`}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}