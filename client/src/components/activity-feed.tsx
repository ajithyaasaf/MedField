import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  FileText, 
  User, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Settings,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Eye,
  Filter,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
  compact?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'attendance' | 'quotation' | 'approval' | 'system' | 'message' | 'user_action';
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
  status?: 'success' | 'pending' | 'failed';
}

export default function ActivityFeed({ 
  className, 
  showHeader = true, 
  maxItems = 10,
  compact = false 
}: ActivityFeedProps) {
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/activities"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const getActionDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'attendance':
        return `${activity.action} at ${activity.target?.name || 'location'}`;
      case 'quotation':
        return `${activity.action} quotation for ${activity.target?.name || 'client'}`;
      case 'approval':
        return `${activity.action} requires approval`;
      case 'system':
        return activity.action;
      case 'message':
        return `sent message: "${activity.metadata?.content?.substring(0, 50)}..."`;
      case 'user_action':
        return `${activity.action}`;
      default:
        return activity.action;
    }
  };

  const getIcon = (type: string, status?: string) => {
    const iconClass = compact ? "h-3 w-3" : "h-4 w-4";
    
    switch (type) {
      case 'attendance':
        return <Clock className={`${iconClass} ${status === 'success' ? 'text-green-600' : 'text-blue-600'}`} />;
      case 'quotation':
        return <FileText className={`${iconClass} ${status === 'pending' ? 'text-yellow-600' : 'text-purple-600'}`} />;
      case 'approval':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'system':
        return <Settings className={`${iconClass} text-gray-600`} />;
      case 'message':
        return <MessageSquare className={`${iconClass} text-blue-600`} />;
      case 'user_action':
        return <Users className={`${iconClass} text-indigo-600`} />;
      default:
        return <User className={`${iconClass} text-gray-600`} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 border-green-200';
      case 'pending':
        return 'bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-blue-100 border-blue-200';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    const baseClass = "w-1 h-full rounded-full";
    switch (priority) {
      case 'high':
        return `${baseClass} bg-red-500`;
      case 'medium':
        return `${baseClass} bg-yellow-500`;
      case 'low':
        return `${baseClass} bg-green-500`;
      default:
        return `${baseClass} bg-gray-300`;
    }
  };

  const limitedActivities = activities.slice(0, maxItems);

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                <div className="h-2 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
            {activities.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activities.length} updates
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {limitedActivities.map((activity: ActivityItem) => (
          <Card 
            key={activity.id} 
            className={`transition-all duration-200 hover:shadow-md border-l-4 ${getStatusColor(activity.status)} ${
              compact ? 'p-2' : 'p-3'
            }`}
          >
            <CardContent className="p-0">
              <div className="flex items-start space-x-3">
                <div className={getPriorityIndicator(activity.priority)}></div>
                
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  {getIcon(activity.type, activity.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`font-medium text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
                          {activity.user.name}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`${compact ? 'text-xs px-1 py-0' : 'text-xs'} capitalize`}
                        >
                          {activity.user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} line-clamp-2`}>
                        {getActionDescription(activity)}
                      </p>

                      {activity.metadata && !compact && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          {activity.metadata.location && (
                            <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                              <MapPin className="h-3 w-3 mr-1" />
                              {activity.metadata.location}
                            </span>
                          )}
                          {activity.metadata.amount && (
                            <span className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {activity.metadata.amount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                      {!compact && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {limitedActivities.length === 0 && !isLoading && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h4>
                <p className="text-sm text-gray-500">Activity will appear here as your team works</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </Card>
        )}

        {activities.length > maxItems && (
          <div className="text-center pt-3">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
              <Eye className="h-4 w-4 mr-2" />
              View all {activities.length} activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}