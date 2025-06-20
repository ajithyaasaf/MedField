
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Bell,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
  compact?: boolean;
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

export default function ActivityFeed({ 
  className, 
  showHeader = true, 
  maxItems = 10, 
  compact = false 
}: ActivityFeedProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['/api/activities'],
    refetchInterval: 30000, // Keep 30-second refresh
    onSuccess: () => setIsRefreshing(false),
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
  const displayedActivities = activityData.slice(0, maxItems);

  const getActivityIcon = (type: string, action: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'attendance':
        return action.includes('clocked') ? 
          <Clock className={`${iconClass} text-blue-600`} /> :
          <MapPin className={`${iconClass} text-amber-600`} />;
      case 'quotation':
        return <FileText className={`${iconClass} text-green-600`} />;
      case 'approval':
        return action.includes('approved') ?
          <CheckCircle className={`${iconClass} text-green-600`} /> :
          <XCircle className={`${iconClass} text-red-600`} />;
      case 'message':
        return <MessageCircle className={`${iconClass} text-blue-600`} />;
      case 'system':
        return <Activity className={`${iconClass} text-gray-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high': 
        return <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />;
      case 'medium': 
        return <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />;
      case 'low': 
        return <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />;
      default: 
        return <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" />;
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatUserRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionText = (activity: ActivityItem) => {
    const { action, target, metadata, type } = activity;
    
    let actionText = action;
    if (target) {
      actionText += ` ${target.name}`;
    }
    
    // Add contextual information based on activity type
    if (type === 'quotation' && metadata?.amount) {
      actionText += ` (${metadata.amount})`;
    }
    
    return actionText;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
  };

  // Auto-refresh indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Activity Feed
            </CardTitle>
            {isRefreshing && (
              <div className="flex items-center text-xs text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span className="hidden sm:inline">Updating...</span>
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={compact ? "p-3" : "p-4"}>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className={`space-y-${compact ? '2' : '3'}`}>
            {displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`group relative flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 ${
                  compact ? 'p-2' : 'p-3'
                } ${
                  index === 0 ? 'ring-1 ring-blue-100 bg-blue-50/30' : ''
                }`}
              >
                {/* Priority Indicator */}
                <div className="absolute left-0 top-3 h-8 flex items-center">
                  {getPriorityIndicator(activity.priority)}
                </div>
                
                {/* User Avatar */}
                <div className="ml-3 flex-shrink-0">
                  <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                      {getUserInitials(activity.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`font-medium text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                        {activity.user.name}
                      </span>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                        {formatUserRole(activity.user.role)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {getActivityIcon(activity.type, activity.action)}
                      <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-gray-700 mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
                    {getActionText(activity)}
                  </p>
                  
                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="space-y-2">
                      {activity.metadata.reason && (
                        <div className="flex items-start space-x-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-800">Requires Attention</p>
                            <p className="text-xs text-amber-700">{activity.metadata.reason}</p>
                          </div>
                        </div>
                      )}
                      
                      {activity.metadata.notes && (
                        <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                          <p className="text-xs text-blue-800">{activity.metadata.notes}</p>
                        </div>
                      )}
                      
                      {/* Status badges and additional info */}
                      <div className="flex flex-wrap gap-1">
                        {activity.metadata.status && (
                          <Badge 
                            variant={activity.metadata.status === 'pending' ? 'outline' : 'default'}
                            className="text-xs"
                          >
                            {activity.metadata.status}
                          </Badge>
                        )}
                        {activity.metadata.location && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                            {activity.metadata.location}
                          </Badge>
                        )}
                        {activity.metadata.hospital && activity.type === 'quotation' && (
                          <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                            {activity.metadata.hospital}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
