
'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import { useEffect, type FC, useState, useMemo } from 'react';
import { useLocation } from '@/hooks/use-location';
import type { Incident, CrimeIncident } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Siren, LocateFixed, ShieldAlert, Mountain, CloudRain } from 'lucide-react';
import { Button } from './ui/button';
import type { LayerProps } from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection, GeoJsonProperties, CircleLayer, FillLayer } from 'geojson';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { PredictUnsafeZonesOutput } from '@/ai/flows/predict-unsafe-zones';
import * as turf from '@turf/turf';

interface MapComponentProps {
  incidents?: Incident[];
  prediction: PredictUnsafeZonesOutput | null;
}


const getRiskZoneColor = (riskTag: 'safe' | 'moderate' | 'high risk' | undefined, opacity = '0.2') => {
    switch (riskTag) {
        case 'safe':
            return `rgba(34, 197, 94, ${opacity})`; // Green
        case 'moderate':
            return `rgba(253, 224, 71, ${opacity})`; // Yellow
        case 'high risk':
            return `rgba(239, 68, 68, ${opacity})`; // Red
        default:
            return `rgba(100, 100, 100, ${opacity})`; // Default grey
    }
}

export function MapComponent({ incidents = [], prediction }: MapComponentProps) {
  const { location, error: locationError } = useLocation();
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [activeCrime, setActiveCrime] = useState<CrimeIncident | null>(null);
  const { toast } = useToast();

  const [viewState, setViewState] = useState({
    latitude: 27.9881, // Default to Mt. Everest
    longitude: 86.9250,
    zoom: 8,
  });

  useEffect(() => {
    if (location) {
        setViewState(prev => ({ ...prev, latitude: location.lat, longitude: location.lng, zoom: 12 }));
    }
    if (locationError) {
        toast({
            title: 'Location Error',
            description: locationError,
            variant: 'destructive'
        })
    }
  }, [location, toast, locationError]);
  

  const riskZoneData = useMemo<Feature | null>(() => {
    if (!prediction?.boundingBox) return null;
    const [south, north, west, east] = prediction.boundingBox;
     if (![south, west, north, east].every(v => typeof v === 'number' && isFinite(v))) {
        console.warn('Invalid boundingBox coordinates received:', prediction.boundingBox);
        return null;
    }
    const polygon = turf.polygon([[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
    ]]);
    return polygon;
  }, [prediction]);

  const riskZoneLayer: FillLayer = {
    id: 'risk-zone-layer',
    type: 'fill',
    paint: {
        'fill-color': getRiskZoneColor(prediction?.riskTag, '0.3'),
        'fill-outline-color': getRiskZoneColor(prediction?.riskTag, '0.8'),
    }
  };


  const mapStyle = `https://api.maptiler.com/maps/streets/style.json?key=lyrPE2ROsZTXexNr0swe`;
  
  if (!'lyrPE2ROsZTXexNr0swe') {
    return <div className="flex h-full w-full items-center justify-center bg-muted text-destructive p-4 text-center">MapTiler API Key is missing. Please add NEXT_PUBLIC_MAPTILER_KEY to your environment variables.</div>;
  }
  
  if (!location) {
      return <Skeleton className="h-full w-full" />;
  }

  const getCrimeMarkerColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
        case 'low': return 'text-yellow-500';
        case 'medium': return 'text-orange-500';
        case 'high': return 'text-red-600';
        default: return 'text-gray-500';
    }
  }

  return (
    <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
    >
        <NavigationControl position="top-right" />
        {location && (
            <Marker longitude={location.lng} latitude={location.lat} anchor="center">
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
                    <LocateFixed className="h-6 w-6 text-primary" />
                </div>
            </Marker>
        )}
        
        {riskZoneData && (
            <Source id="risk-zone-source" type="geojson" data={riskZoneData}>
                <Layer {...riskZoneLayer as LayerProps} />
            </Source>
        )}

        {incidents.map(incident => (
          <Marker
            key={incident.id}
            longitude={incident.lng}
            latitude={incident.lat}
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                setActiveIncident(incident)
            }}
            
          >
             <div className="relative cursor-pointer">
                {incident.status === 'New' && <div className="absolute inset-0 bg-accent/50 rounded-full animate-ping"></div>}
                <Siren className="h-8 w-8 text-accent drop-shadow-lg" />
            </div>
          </Marker>
        ))}

        {prediction?.crimeHotspots?.map(crime => (
            <Marker
                key={crime.id}
                longitude={crime.lon}
                latitude={crime.lat}
                 onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setActiveCrime(crime);
                 }}
            >
                <ShieldAlert className={cn("h-7 w-7 drop-shadow-lg cursor-pointer", getCrimeMarkerColor(crime.severity))} />
            </Marker>
        ))}

        {prediction?.environmentalHazards?.map(hazard => (
            <Marker
                key={hazard.id}
                longitude={hazard.lon}
                latitude={hazard.lat}
            >
                {hazard.type === 'landslide' && <Mountain className="h-7 w-7 text-orange-700 drop-shadow-lg" />}
                {hazard.type === 'weather' && <CloudRain className="h-7 w-7 text-blue-500 drop-shadow-lg" />}
            </Marker>
        ))}

        {activeIncident && (
            <Popup
                longitude={activeIncident.lng}
                latitude={activeIncident.lat}
                onClose={() => setActiveIncident(null)}
                anchor="bottom"
                closeButton={true}
                closeOnClick={false}
                offset={35}
            >
                <div className="p-1">
                  <h3 className="font-bold text-base">SOS Alert</h3>
                  <p>Status: {activeIncident.status}</p>
                  <p>Time: {activeIncident.timestamp.toLocaleTimeString()}</p>
                  <Button size="sm" className="mt-2 w-full" onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeIncident.lat},${activeIncident.lng}`;
                    window.open(url, '_blank');
                  }}>Get Directions</Button>
                </div>
            </Popup>
        )}

        {activeCrime && (
            <Popup
                longitude={activeCrime.lon}
                latitude={activeCrime.lat}
                onClose={() => setActiveCrime(null)}
                anchor="bottom"
                closeButton={true}
                closeOnClick={false}
                offset={35}
            >
                <div className="p-1 max-w-xs">
                  <h3 className="font-bold text-base capitalize text-destructive">{activeCrime.crime_type.replace(/_/g, ' ')}</h3>
                  <p className="text-sm font-medium">Severity: <span className={cn('font-bold', getCrimeMarkerColor(activeCrime.severity))}>{activeCrime.severity}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{activeCrime.summary}</p>
                  {activeCrime.source_url && (
                    <Button size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => {
                        window.open(activeCrime.source_url, '_blank');
                    }}>Read More</Button>
                  )}
                </div>
            </Popup>
        )}

      </Map>
  );
}
