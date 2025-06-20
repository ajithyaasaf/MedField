import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  UserPlus, 
  MapPin,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  role: z.enum(['field_rep', 'admin']),
  territory: z.string().optional(),
  assignedHospitals: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserManagementProps {
  onClose: () => void;
  hospitals: any[];
}

export default function UserManagement({ onClose, hospitals }: UserManagementProps) {
  const { toast } = useToast();
  const [showNewUser, setShowNewUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      name: '',
      employeeId: '',
      role: 'field_rep',
      territory: '',
      assignedHospitals: [],
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', {
        ...data,
        assignedHospitals: data.assignedHospitals?.map(id => parseInt(id)) || [],
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Created',
        description: 'New user has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      form.reset();
      setShowNewUser(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<UserFormData> }) => {
      const response = await apiRequest('PATCH', `/api/users/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Updated',
        description: 'User information has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        updates: data,
      });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: '', // Don't populate password for security
      name: user.name,
      employeeId: user.employeeId,
      role: user.role,
      territory: user.territory || '',
      assignedHospitals: user.assignedHospitals?.map((id: number) => id.toString()) || [],
    });
    setShowNewUser(true);
  };

  const fieldReps = users?.filter((u: any) => u.role === 'field_rep') || [];
  const admins = users?.filter((u: any) => u.role === 'admin') || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-medical-gray-dark">User Management</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                setShowNewUser(true);
                setEditingUser(null);
                form.reset();
              }}
              className="bg-medical-blue hover:bg-medical-blue-dark"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {showNewUser && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        {...form.register('username')}
                        placeholder="Enter username"
                      />
                      {form.formState.errors.username && (
                        <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        type="password"
                        {...form.register('password')}
                        placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                      />
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        {...form.register('name')}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        {...form.register('employeeId')}
                        placeholder="Enter employee ID"
                      />
                    </div>

                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select onValueChange={(value) => form.setValue('role', value as 'field_rep' | 'admin')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="field_rep">Field Representative</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="territory">Territory</Label>
                      <Input
                        {...form.register('territory')}
                        placeholder="Enter territory (optional)"
                      />
                    </div>
                  </div>

                  {form.watch('role') === 'field_rep' && (
                    <div>
                      <Label>Assigned Hospitals</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {hospitals.map((hospital) => (
                          <label key={hospital.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={hospital.id.toString()}
                              {...form.register('assignedHospitals')}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{hospital.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewUser(false);
                        setEditingUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-medical-blue hover:bg-medical-blue-dark"
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Field Representatives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-medical-blue" />
                  Field Representatives ({fieldReps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldReps.map((user: any) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-medical-gray-dark">{user.name}</h4>
                          <p className="text-sm text-medical-gray">@{user.username}</p>
                          <p className="text-sm text-medical-gray">ID: {user.employeeId}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {user.territory && (
                        <div className="flex items-center text-xs text-medical-gray mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{user.territory}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-medical-gray">
                        <Building className="h-3 w-3 mr-1" />
                        <span>{user.assignedHospitals?.length || 0} hospitals assigned</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Administrators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-medical-green" />
                  Administrators ({admins.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((user: any) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-medical-gray-dark">{user.name}</h4>
                          <p className="text-sm text-medical-gray">@{user.username}</p>
                          <p className="text-sm text-medical-gray">ID: {user.employeeId}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-medical-green">
                            Admin
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {user.territory && (
                        <div className="flex items-center text-xs text-medical-gray">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{user.territory}</span>
                        </div>
                      )}
                      <div className="text-xs text-medical-gray">
                        Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}