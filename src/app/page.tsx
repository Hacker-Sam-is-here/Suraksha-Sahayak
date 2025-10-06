'use client';
import { Header } from '@/components/Header';
import { MapComponent } from '@/components/MapComponent';
import { RiskCard } from '@/components/RiskCard';
import { SOSButton } from '@/components/SOSButton';
import { useLocation } from '@/hooks/use-location';
import { useIncidents } from '@/context/IncidentContext';
import { predictUnsafeZones, type PredictUnsafeZonesOutput } from '@/ai/flows/predict-unsafe-zones';
import { useEffect, useState, useRef } from 'react';
import { IncidentFeed } from '@/components/IncidentFeed';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { location } = useLocation();
  const { incidents } = useIncidents();
  const [prediction, setPrediction] = useState<PredictUnsafeZonesOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const notifiedRiskZone = useRef<string | null>(null);

  useEffect(() => {
    if (location) {
      setLoading(true);
      predictUnsafeZones({
        locationLat: location.lat,
        locationLong: location.lng,
      })
        .then(setPrediction)
        .catch(err => {
          console.error('Error predicting unsafe zones:', err);
          // Toast notification is handled in the RiskCard
        })
        .finally(() => setLoading(false));
    }
  }, [location]);

  useEffect(() => {
    if (prediction?.riskTag === 'high risk') {
      const zoneId = `${prediction.locationName}-${prediction.riskTag}`;
      if (notifiedRiskZone.current !== zoneId) {
        toast({
          title: '⚠️ High Risk Zone Detected',
          description: 'Exercise extreme caution in this area. Check Area Scan for details.',
          variant: 'destructive',
          duration: 10000,
        });
        notifiedRiskZone.current = zoneId;
      }
    }
  }, [prediction, toast]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Header />
      <main className="h-full w-full">
        <MapComponent 
          incidents={incidents} 
          prediction={prediction}
        />
      </main>
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-4">
        <RiskCard 
          latitude={location?.lat ?? null} 
          longitude={location?.lng ?? null}
          prediction={prediction} 
          loading={loading}
        />
        <IncidentFeed prediction={prediction} />
      </div>
      <SOSButton />
    </div>
  );
}
