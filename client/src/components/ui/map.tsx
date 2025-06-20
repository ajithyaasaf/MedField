import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MapComponentProps {
  geoFences: any[];
  hospitals: any[];
  attendance: any[];
  users: any[];
}

export default function MapComponent({ geoFences, hospitals, attendance, users }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulate field rep locations based on attendance
  const fieldRepLocations = attendance.map((record) => {
    const user = users.find(u => u.id === record.userId);
    const hospital = hospitals.find(h => h.id === record.hospitalId);
    
    return {
      id: record.id,
      user: user?.name || "Unknown Rep",
      hospital: hospital?.name || "Unknown Location",
      lat: parseFloat(record.clockInLat || "40.7589"),
      lng: parseFloat(record.clockInLng || "-73.9851"),
      status: record.clockOutTime ? "completed" : "active",
      withinGeoFence: record.withinGeoFence,
    };
  });

  return (
    <div className="relative">
      {/* Simulated Map */}
      <div 
        ref={mapRef}
        className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-80 relative overflow-hidden border border-gray-200"
      >
        {/* Geo-fence zones */}
        {geoFences.map((fence, index) => {
          const hospital = hospitals.find(h => h.id === fence.hospitalId);
          const size = Math.min(Math.max(fence.radiusMeters / 5, 60), 120);
          const left = 20 + (index * 120) % 300;
          const top = 30 + (index * 80) % 200;
          
          return (
            <div
              key={fence.id}
              className="absolute border-2 border-dashed rounded-full flex items-center justify-center bg-opacity-10"
              style={{
                width: size,
                height: size,
                left: left,
                top: top,
                borderColor: index % 2 === 0 ? '#2563EB' : '#10B981',
                backgroundColor: index % 2 === 0 ? '#2563EB20' : '#10B98120',
              }}
            >
              <span className="text-xs font-medium text-center p-1">
                {fence.name.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {/* Field rep markers */}
        {fieldRepLocations.map((rep, index) => {
          const left = 50 + (index * 80) % 250;
          const top = 60 + (index * 60) % 180;
          
          return (
            <div
              key={rep.id}
              className="absolute"
              style={{ left, top }}
            >
              <div
                className={`w-4 h-4 rounded-full shadow-lg ${
                  rep.status === 'active' 
                    ? rep.withinGeoFence 
                      ? 'bg-medical-green' 
                      : 'bg-medical-amber'
                    : 'bg-medical-blue'
                } ${rep.status === 'active' ? 'animate-pulse' : ''}`}
                title={`${rep.user} - ${rep.hospital}`}
              />
            </div>
          );
        })}

        {/* Map legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-medical-blue rounded-full"></div>
              <span>Clocked Out ({fieldRepLocations.filter(r => r.status === 'completed').length})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-medical-green rounded-full"></div>
              <span>On Visit ({fieldRepLocations.filter(r => r.status === 'active' && r.withinGeoFence).length})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-medical-amber rounded-full"></div>
              <span>Outside Zone ({fieldRepLocations.filter(r => r.status === 'active' && !r.withinGeoFence).length})</span>
            </div>
          </div>
        </div>

        {/* Map controls overlay */}
        <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md">
          <div className="text-xs text-medical-gray">
            Real-time GPS Tracking
          </div>
          <div className="text-xs text-medical-green font-medium">
            {fieldRepLocations.filter(r => r.status === 'active').length} Active Reps
          </div>
        </div>
      </div>

      {/* Field Rep Status Cards */}
      {fieldRepLocations.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-medical-gray-dark">Active Field Representatives</h4>
          <div className="grid gap-2">
            {fieldRepLocations.slice(0, 3).map((rep) => (
              <div key={rep.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-medical-gray-dark">{rep.user}</div>
                  <div className="text-xs text-medical-gray">{rep.hospital}</div>
                </div>
                <Badge
                  variant={
                    rep.status === 'completed' ? 'default' :
                    rep.withinGeoFence ? 'default' : 'secondary'
                  }
                  className={
                    rep.status === 'active' && rep.withinGeoFence ? 'bg-medical-green' :
                    rep.status === 'active' && !rep.withinGeoFence ? 'bg-medical-amber' : ''
                  }
                >
                  {rep.status === 'completed' ? 'Completed' :
                   rep.withinGeoFence ? 'On Site' : 'Transit'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
