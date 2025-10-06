'use client';

import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
}

const DEFAULT_LOCATION: Location = {
  lat: 27.9881,
  lng: 86.9250,
};

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number | null = null;

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      const handleSuccess = (position: GeolocationPosition) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      };

      const handleError = (err: GeolocationPositionError) => {
        setError('Could not determine your location. Showing default location on map.');
        setLocation(DEFAULT_LOCATION);
        console.warn(`Geolocation error: ${err.message}`);
      };

      // Use watchPosition to get real-time updates
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000, // Request a new position every 5 seconds
      });
    } else {
      setError('Geolocation is not supported by your browser. Showing default location on map.');
      setLocation(DEFAULT_LOCATION);
    }

    return () => {
      // Clear the watch when the component unmounts
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return { location, error };
}
