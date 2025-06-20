import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CalendarDays, MapPin, Clock, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const scheduleSchema = z.object({
  hospitalId: z.string().min(1, 'Hospital is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  notes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleManagerProps {
  onClose: () => void;
  hospitals: any[];
}

export default function ScheduleManager({ onClose, hospitals }: ScheduleManagerProps) {
  const { toast } = useToast();
  const [showNewSchedule, setShowNewSchedule] = useState(false);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['/api/schedules'],
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      hospitalId: '',
      scheduledDate: '',
      scheduledTime: '',
      purpose: '',
      notes: '',
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await apiRequest('POST', '/api/schedules', {
        ...data,
        hospitalId: parseInt(data.hospitalId),
        scheduledDate: new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Schedule Created',
        description: 'Visit has been scheduled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      form.reset();
      setShowNewSchedule(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create schedule',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    createScheduleMutation.mutate(data);
  };

  const todaySchedules = schedules?.filter((schedule: any) => 
    new Date(schedule.scheduledDate).toDateString() === new Date().toDateString()
  ) || [];

  const upcomingSchedules = schedules?.filter((schedule: any) => 
    new Date(schedule.scheduledDate) > new Date()
  ) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-medical-gray-dark">Schedule Management</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowNewSchedule(true)}
              className="bg-medical-blue hover:bg-medical-blue-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {showNewSchedule ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Schedule New Visit</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hospitalId">Hospital</Label>
                      <Select onValueChange={(value) => form.setValue('hospitalId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={hospital.id.toString()}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="purpose">Purpose</Label>
                      <Select onValueChange={(value) => form.setValue('purpose', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product_demo">Product Demo</SelectItem>
                          <SelectItem value="quotation_follow_up">Quotation Follow-up</SelectItem>
                          <SelectItem value="maintenance_visit">Maintenance Visit</SelectItem>
                          <SelectItem value="training_session">Training Session</SelectItem>
                          <SelectItem value="client_meeting">Client Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="scheduledDate">Date</Label>
                      <Input
                        type="date"
                        {...form.register('scheduledDate')}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="scheduledTime">Time</Label>
                      <Input
                        type="time"
                        {...form.register('scheduledTime')}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      {...form.register('notes')}
                      placeholder="Additional notes for the visit..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewSchedule(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-medical-blue hover:bg-medical-blue-dark"
                      disabled={createScheduleMutation.isPending}
                    >
                      {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-medical-blue" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No visits scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedules.map((schedule: any) => {
                      const hospital = hospitals.find(h => h.id === schedule.hospitalId);
                      return (
                        <div key={schedule.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-medical-gray-dark">{hospital?.name}</h4>
                              <p className="text-sm text-medical-gray">{schedule.purpose.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-medical-blue">
                                {format(new Date(schedule.scheduledDate), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-medical-gray">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{hospital?.address}</span>
                          </div>
                          {schedule.notes && (
                            <p className="text-xs text-medical-gray mt-2">{schedule.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-medical-green" />
                  Upcoming Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming visits scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSchedules.slice(0, 5).map((schedule: any) => {
                      const hospital = hospitals.find(h => h.id === schedule.hospitalId);
                      return (
                        <div key={schedule.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-medical-gray-dark">{hospital?.name}</h4>
                              <p className="text-sm text-medical-gray">{schedule.purpose.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-medical-green">
                                {format(new Date(schedule.scheduledDate), 'MMM d')}
                              </p>
                              <p className="text-xs text-medical-gray">
                                {format(new Date(schedule.scheduledDate), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-medical-gray">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{hospital?.address}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}