import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ManualAttendanceApprovalProps {
  onClose: () => void;
}

interface PendingAttendance {
  id: number;
  userId: number;
  hospitalId: number;
  clockInTime: string;
  clockInLat: string;
  clockInLng: string;
  withinGeoFence: boolean;
  reason?: string;
  user: {
    name: string;
    employeeId: string;
  };
  hospital: {
    name: string;
    address: string;
  };
  distanceFromFence: number;
}

export default function ManualAttendanceApproval({ onClose }: ManualAttendanceApprovalProps) {
  const { toast } = useToast();
  const [selectedAttendance, setSelectedAttendance] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const { data: pendingAttendance, isLoading } = useQuery({
    queryKey: ['/api/attendance/pending-approval'],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/attendance/${id}/approve`, {
        approved: true,
        approvalNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Attendance Approved',
        description: 'Manual attendance has been approved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/pending-approval'] });
      setSelectedAttendance(null);
      setApprovalNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve attendance',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/attendance/${id}/approve`, {
        approved: false,
        approvalNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Attendance Rejected',
        description: 'Manual attendance has been rejected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/pending-approval'] });
      setSelectedAttendance(null);
      setApprovalNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject attendance',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (attendanceId: number) => {
    if (!approvalNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide approval notes for manual attendance.',
        variant: 'destructive',
      });
      return;
    }

    approveMutation.mutate({
      id: attendanceId,
      notes: approvalNotes,
    });
  };

  const handleReject = (attendanceId: number) => {
    if (!approvalNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide rejection reason for manual attendance.',
        variant: 'destructive',
      });
      return;
    }

    rejectMutation.mutate({
      id: attendanceId,
      notes: approvalNotes,
    });
  };

  // Mock data for demonstration
  const mockPendingAttendance: PendingAttendance[] = [
    {
      id: 1,
      userId: 3,
      hospitalId: 1,
      clockInTime: new Date().toISOString(),
      clockInLat: '40.7580',
      clockInLng: '-73.9855',
      withinGeoFence: false,
      reason: 'Parking lot entrance - could not get closer to building',
      user: {
        name: 'Mike Chen',
        employeeId: 'REP002',
      },
      hospital: {
        name: "St. Mary's Hospital",
        address: '123 Healthcare Blvd, Medical District',
      },
      distanceFromFence: 150,
    },
    {
      id: 2,
      userId: 4,
      hospitalId: 2,
      clockInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      clockInLat: '40.7510',
      clockInLng: '-73.9940',
      withinGeoFence: false,
      reason: 'Meeting with doctor in nearby café before official visit',
      user: {
        name: 'Anna Martinez',
        employeeId: 'REP003',
      },
      hospital: {
        name: 'General Medical Center',
        address: '456 Health Ave, Downtown',
      },
      distanceFromFence: 200,
    },
  ];

  const attendanceData = pendingAttendance || mockPendingAttendance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-medical-amber" />
              <span>Manual Attendance Approval</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Review and approve attendance records that were submitted outside geo-fence boundaries
          </p>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {attendanceData.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">All Clear!</h3>
              <p className="text-gray-500">No manual attendance approvals pending.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {attendanceData.map((attendance) => (
                <Card key={attendance.id} className="border-l-4 border-l-medical-amber">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-medical-gray-dark">
                          {attendance.user.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Employee ID: {attendance.user.employeeId}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-medical-amber text-medical-amber">
                        Pending Approval
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-medical-blue" />
                          <span className="font-medium">Hospital:</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-6">
                          {attendance.hospital.name}
                        </p>
                        <p className="text-xs text-gray-500 ml-6">
                          {attendance.hospital.address}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-medical-green" />
                          <span className="font-medium">Clock In Time:</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-6">
                          {format(new Date(attendance.clockInTime), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>

                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Outside Geo-fence:</strong> This attendance was recorded {attendance.distanceFromFence}m away from the designated area.
                        <br />
                        <strong>Location:</strong> {attendance.clockInLat}, {attendance.clockInLng}
                      </AlertDescription>
                    </Alert>

                    {attendance.reason && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-medical-blue" />
                          <span className="font-medium">Employee's Reason:</span>
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          "{attendance.reason}"
                        </p>
                      </div>
                    )}

                    {selectedAttendance === attendance.id ? (
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approval/Rejection Notes *
                          </label>
                          <Textarea
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            placeholder="Provide detailed notes for this decision..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApprove(attendance.id)}
                            disabled={approveMutation.isPending || !approvalNotes.trim()}
                            className="bg-medical-green hover:bg-medical-green-dark"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          
                          <Button
                            onClick={() => handleReject(attendance.id)}
                            disabled={rejectMutation.isPending || !approvalNotes.trim()}
                            variant="outline"
                            className="border-medical-red text-medical-red hover:bg-medical-red hover:text-white"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          
                          <Button
                            onClick={() => {
                              setSelectedAttendance(null);
                              setApprovalNotes('');
                            }}
                            variant="ghost"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedAttendance(attendance.id);
                            setApprovalNotes('');
                          }}
                          variant="outline"
                          className="border-medical-blue text-medical-blue"
                        >
                          Review & Decide
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}