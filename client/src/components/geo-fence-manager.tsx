import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, Trash2, Settings } from "lucide-react";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const geoFenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  hospitalId: z.number().min(1, "Please select a hospital"),
  centerLat: z.string().min(1, "Latitude is required"),
  centerLng: z.string().min(1, "Longitude is required"),
  radiusMeters: z.number().min(10, "Minimum radius is 10 meters").max(1000, "Maximum radius is 1000 meters"),
});

type GeoFenceFormData = z.infer<typeof geoFenceSchema>;

interface GeoFenceManagerProps {
  onClose: () => void;
  hospitals: any[];
  geoFences: any[];
}

export default function GeoFenceManager({ onClose, hospitals, geoFences }: GeoFenceManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<GeoFenceFormData>({
    resolver: zodResolver(geoFenceSchema),
    defaultValues: {
      name: "",
      hospitalId: 0,
      centerLat: "",
      centerLng: "",
      radiusMeters: 100,
    },
  });

  const createGeoFenceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/geo-fences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Geo-Fence Created",
        description: "New geo-fence has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/geo-fences'] });
      form.reset();
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create geo-fence",
        variant: "destructive",
      });
    },
  });

  const deleteGeoFenceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/geo-fences/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Geo-Fence Deleted",
        description: "Geo-fence has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/geo-fences'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete geo-fence",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GeoFenceFormData) => {
    createGeoFenceMutation.mutate(data);
  };

  const handleHospitalSelect = (hospitalId: number) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital && hospital.latitude && hospital.longitude) {
      form.setValue("centerLat", hospital.latitude);
      form.setValue("centerLng", hospital.longitude);
      form.setValue("name", `${hospital.name} Zone`);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-medical-blue" />
            Geo-Fence Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <p className="text-medical-gray">
              Manage geo-fences for attendance tracking and location verification
            </p>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-medical-blue hover:bg-medical-blue-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Geo-Fence
            </Button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Geo-Fence</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Hospital</Label>
                    <Select
                      value={form.watch("hospitalId")?.toString() || ""}
                      onValueChange={(value) => {
                        const hospitalId = parseInt(value);
                        form.setValue("hospitalId", hospitalId);
                        handleHospitalSelect(hospitalId);
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a hospital" />
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
                    <Label htmlFor="name" className="text-sm font-medium">Geo-Fence Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., St. Mary's Hospital Zone"
                      className="mt-1"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-medical-red mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="centerLat" className="text-sm font-medium">Latitude</Label>
                      <Input
                        id="centerLat"
                        placeholder="40.7589"
                        className="mt-1"
                        {...form.register("centerLat")}
                      />
                      {form.formState.errors.centerLat && (
                        <p className="text-sm text-medical-red mt-1">
                          {form.formState.errors.centerLat.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="centerLng" className="text-sm font-medium">Longitude</Label>
                      <Input
                        id="centerLng"
                        placeholder="-73.9851"
                        className="mt-1"
                        {...form.register("centerLng")}
                      />
                      {form.formState.errors.centerLng && (
                        <p className="text-sm text-medical-red mt-1">
                          {form.formState.errors.centerLng.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="radiusMeters" className="text-sm font-medium">
                      Radius (meters)
                    </Label>
                    <Input
                      id="radiusMeters"
                      type="number"
                      min="10"
                      max="1000"
                      placeholder="100"
                      className="mt-1"
                      {...form.register("radiusMeters", { valueAsNumber: true })}
                    />
                    {form.formState.errors.radiusMeters && (
                      <p className="text-sm text-medical-red mt-1">
                        {form.formState.errors.radiusMeters.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      className="bg-medical-green hover:bg-medical-green-dark"
                      disabled={createGeoFenceMutation.isPending}
                    >
                      {createGeoFenceMutation.isPending ? "Creating..." : "Create Geo-Fence"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Existing Geo-Fences */}
          <div>
            <h3 className="text-lg font-semibold text-medical-gray-dark mb-4">
              Existing Geo-Fences ({geoFences.length})
            </h3>
            
            {geoFences.length === 0 ? (
              <div className="text-center py-8 text-medical-gray">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No geo-fences configured yet</p>
                <p className="text-sm">Create your first geo-fence to start tracking attendance</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {geoFences.map((geoFence) => {
                  const hospital = hospitals.find(h => h.id === geoFence.hospitalId);
                  return (
                    <Card key={geoFence.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-medical-gray-dark">{geoFence.name}</h4>
                              <Badge variant={geoFence.isActive ? "default" : "secondary"}>
                                {geoFence.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-medical-gray mb-1">
                              <strong>Hospital:</strong> {hospital?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-medical-gray mb-1">
                              <strong>Location:</strong> {geoFence.centerLat}, {geoFence.centerLng}
                            </p>
                            <p className="text-sm text-medical-gray">
                              <strong>Radius:</strong> {geoFence.radiusMeters} meters
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {}}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-medical-red hover:text-red-600"
                              onClick={() => deleteGeoFenceMutation.mutate(geoFence.id)}
                              disabled={deleteGeoFenceMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
