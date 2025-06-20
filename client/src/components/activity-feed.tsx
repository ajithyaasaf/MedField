import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity, 
  Clock, 
  FileText, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  Send,
  Filter,
  RefreshCw,
  Bell
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'attendance' | 'quotation' | 'approval' | 'system' | 'message';
  user: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  action: string;
  target?: {
    type: string;
    name: string;
    id: string;
  };
  metadata?: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export default function ActivityFeed({ className }: ActivityFeedProps) {
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: activities, refetch } = useQuery({
    queryKey: ['/api/activities', filter],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Generate mock activity data for demonstration
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'attendance',
      user: { id: 3, name: 'Sarah Johnson', role: 'field_rep' },
      action: 'clocked in',
      target: { type: 'hospital', name: "St. Mary's Hospital", id: '1' },
      metadata: { location: 'Within geo-fence', gpsAccuracy: '±5m' },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      priority: 'low'
    },
    {
      id: '2',
      type: 'quotation',
      user: { id: 4, name: 'Mike Chen', role: 'field_rep' },
      action: 'submitted quotation',
      target: { type: 'quotation', name: 'QUO-2024-001', id: 'quo1' },
      metadata: { amount: '$45,000', hospital: 'General Medical Center' },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: 'medium'
    },
    {
      id: '3',
      type: 'approval',
      user: { id: 1, name: 'System Administrator', role: 'admin' },
      action: 'approved quotation',
      target: { type: 'quotation', name: 'QUO-2024-001', id: 'quo1' },
      metadata: { decision: 'approved', notes: 'Competitive pricing, good fit for hospital needs' },
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      priority: 'high'
    },
    {
      id: '4',
      type: 'attendance',
      user: { id: 5, name: 'Anna Martinez', role: 'field_rep' },
      action: 'requested manual approval',
      target: { type: 'hospital', name: 'University Medical Center', id: '3' },
      metadata: { reason: 'Parking restrictions - 150m from designated area', status: 'pending' },
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      priority: 'high'
    },
    {
      id: '5',
      type: 'system',
      user: { id: 0, name: 'System', role: 'system' },
      action: 'generated backup',
      target: { type: 'system', name: 'Database Backup', id: 'backup1' },
      metadata: { size: '2.4 GB', duration: '3m 42s' },
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      priority: 'low'
    },
    {
      id: '6',
      type: 'quotation',
      user: { id: 3, name: 'Sarah Johnson', role: 'field_rep' },
      action: 'sent quotation via email',
      target: { type: 'quotation', name: 'QUO-2024-002', id: 'quo2' },
      metadata: { recipient: 'contact@citygeneral.com', method: 'email' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      priority: 'medium'
    }
  ];

  const activityData = activities || mockActivities;

  const getActivityIcon = (type: string, action: string) => {
    switch (type) {
      case 'attendance':
        return action.includes('clocked') ? 
          <Clock className="h-4 w-4 text-medical-blue" /> :
          <MapPin className="h-4 w-4 text-medical-amber" />;
      case 'quotation':
        return <FileText className="h-4 w-4 text-medical-green" />;
      case 'approval':
        return action.includes('approved') ?
          <CheckCircle className="h-4 w-4 text-medical-green" /> :
          <XCircle className="h-4 w-4 text-medical-red" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-medical-blue" />;
      case 'system':
        return <Activity className="h-4 w-4 text-medical-gray" />;
      default:
        return <Bell className="h-4 w-4 text-medical-gray" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-medical-red';
      case 'medium': return 'border-l-medical-amber';
      case 'low': return 'border-l-medical-blue';
      default: return 'border-l-gray-300';
    }
  };

  const getActionDescription = (activity: ActivityItem) => {
    const { user, action, target, metadata } = activity;
    let description = `${user.name} ${action}`;
    
    if (target) {
      description += ` ${target.name}`;
    }
    
    if (metadata) {
      if (metadata.amount) description += ` (${metadata.amount})`;
      if (metadata.hospital && activity.type === 'quotation') description += ` for ${metadata.hospital}`;
      if (metadata.location && activity.type === 'attendance') description += ` - ${metadata.location}`;
    }
    
    return description;
  };

  const filteredActivities = activityData.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  const activityTypes = [
    { value: 'all', label: 'All Activities', icon: Activity },
    { value: 'attendance', label: 'Attendance', icon: Clock },
    { value: 'quotation', label: 'Quotations', icon: FileText },
    { value: 'approval', label: 'Approvals', icon: CheckCircle },
    { value: 'system', label: 'System', icon: Bell },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-medical-blue" />
            Live Activity Feed
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-medical-green" : ""}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Activity Type Filters */}
        <div className="flex space-x-2 mt-4">
          {activityTypes.map((type) => (
            <Button
              key={type.value}
              variant={filter === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type.value)}
              className={filter === type.value ? "bg-medical-blue" : ""}
            >
              <type.icon className="h-4 w-4 mr-1" />
              {type.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`border-l-4 ${getPriorityColor(activity.priority)} bg-gray-50 p-4 rounded-r-lg`}
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    {getActivityIcon(activity.type, activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-medical-gray-dark">
                          {activity.user.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {activity.user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-medical-gray">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-medical-gray mb-2">
                      {getActionDescription(activity)}
                    </p>
                    
                    {activity.metadata && (
                      <div className="text-xs text-medical-gray space-y-1">
                        {activity.metadata.reason && (
                          <p className="bg-yellow-50 text-yellow-800 p-2 rounded">
                            <strong>Reason:</strong> {activity.metadata.reason}
                          </p>
                        )}
                        {activity.metadata.notes && (
                          <p className="bg-blue-50 text-blue-800 p-2 rounded">
                            <strong>Notes:</strong> {activity.metadata.notes}
                          </p>
                        )}
                        {activity.metadata.gpsAccuracy && (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                            GPS: {activity.metadata.gpsAccuracy}
                          </span>
                        )}
                        {activity.metadata.status && (
                          <Badge 
                            variant={activity.metadata.status === 'pending' ? 'outline' : 'default'}
                            className="ml-2"
                          >
                            {activity.metadata.status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}