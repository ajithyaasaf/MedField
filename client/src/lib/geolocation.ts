/**
 * Geolocation utility functions for GPS-based attendance tracking
 * and geo-fence calculations
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoFence {
  id: number;
  name: string;
  centerLat: string;
  centerLng: string;
  radiusMeters: number;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a coordinate is within a geo-fence
 */
export function isWithinGeoFence(
  currentLocation: Coordinates,
  geoFence: GeoFence
): boolean {
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    parseFloat(geoFence.centerLat),
    parseFloat(geoFence.centerLng)
  );

  return distance <= geoFence.radiusMeters;
}

/**
 * Find the nearest geo-fence to a given location
 */
export function findNearestGeoFence(
  currentLocation: Coordinates,
  geoFences: GeoFence[]
): { geoFence: GeoFence; distance: number } | null {
  if (geoFences.length === 0) return null;

  let nearest = geoFences[0];
  let minDistance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    parseFloat(nearest.centerLat),
    parseFloat(nearest.centerLng)
  );

  for (let i = 1; i < geoFences.length; i++) {
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      parseFloat(geoFences[i].centerLat),
      parseFloat(geoFences[i].centerLng)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = geoFences[i];
    }
  }

  return { geoFence: nearest, distance: minDistance };
}

/**
 * Check if a location is within any of the provided geo-fences
 */
export function checkGeoFenceCompliance(
  currentLocation: Coordinates,
  geoFences: GeoFence[]
): {
  isCompliant: boolean;
  nearestGeoFence: GeoFence | null;
  distance: number;
  withinRadius: boolean;
} {
  if (geoFences.length === 0) {
    return {
      isCompliant: false,
      nearestGeoFence: null,
      distance: Infinity,
      withinRadius: false,
    };
  }

  const nearest = findNearestGeoFence(currentLocation, geoFences);
  if (!nearest) {
    return {
      isCompliant: false,
      nearestGeoFence: null,
      distance: Infinity,
      withinRadius: false,
    };
  }

  const withinRadius = nearest.distance <= nearest.geoFence.radiusMeters;

  return {
    isCompliant: withinRadius,
    nearestGeoFence: nearest.geoFence,
    distance: nearest.distance,
    withinRadius,
  };
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Get the current position with enhanced error handling
 */
export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        let message = "Unknown geolocation error";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied by user. Please enable location services and refresh the page.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Please check your GPS or internet connection.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }
        
        reject(new Error(message));
      },
      defaultOptions
    );
  });
}

/**
 * Watch position with enhanced error handling
 */
export function watchPosition(
  successCallback: (position: GeolocationPosition) => void,
  errorCallback: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number | null {
  if (!navigator.geolocation) {
    errorCallback({
      code: 2,
      message: "Geolocation is not supported by this browser",
    } as GeolocationPositionError);
    return null;
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 60000, // 1 minute
    ...options,
  };

  return navigator.geolocation.watchPosition(
    successCallback,
    errorCallback,
    defaultOptions
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: Coordinates, precision: number = 6): string {
  return `${coordinates.latitude.toFixed(precision)}, ${coordinates.longitude.toFixed(precision)}`;
}

/**
 * Validate if coordinates are valid
 */
export function areValidCoordinates(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;
  
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Calculate the bearing between two coordinates
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): number {
  const φ1 = degreesToRadians(startLat);
  const φ2 = degreesToRadians(endLat);
  const Δλ = degreesToRadians(endLng - startLng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = radiansToDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}
