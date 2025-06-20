import React from 'react';
import { MapPin, Navigation, Circle } from 'lucide-react';

interface MapComponentProps {
  geoFences: any[];
  hospitals: any[];
  attendance: any[];
  users: any[];
  className?: string;
}

export default function MapComponent({ 
  geoFences, 
  hospitals, 
  attendance, 
  users,
  className 
}: MapComponentProps) {
  return (
    <div className={`relative bg-gray-50 rounded-lg p-4 min-h-[400px] ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Interactive Map View</p>
          <p className="text-gray-400 text-xs mt-1">
            {geoFences.length} geo-fences • {hospitals.length} hospitals
          </p>
        </div>
      </div>
      
      {/* Map overlay showing data */}
      <div className="absolute top-4 left-4 space-y-2">
        {geoFences.map((fence: any) => (
          <div key={fence.id} className="flex items-center space-x-2 bg-white p-2 rounded shadow-sm">
            <Circle className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-600">{fence.name}</span>
          </div>
        ))}
      </div>
      
      {/* Active users overlay */}
      <div className="absolute top-4 right-4 space-y-2">
        {attendance.map((att: any) => {
          const user = users.find((u: any) => u.id === att.userId);
          const hospital = hospitals.find((h: any) => h.id === att.hospitalId);
          return (
            <div key={att.id} className="flex items-center space-x-2 bg-green-50 p-2 rounded shadow-sm">
              <Navigation className="h-4 w-4 text-green-600" />
              <div className="text-xs">
                <p className="font-medium text-green-800">{user?.name}</p>
                <p className="text-green-600">{hospital?.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}