
'use client';

import { useState, useEffect } from 'react';
import type { PredictUnsafeZonesOutput } from '@/ai/flows/predict-unsafe-zones';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ShieldAlert, ShieldCheck, Activity, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RiskCardProps {
  latitude: number | null;
  longitude: number | null;
  prediction: PredictUnsafeZonesOutput | null;
  loading: boolean;
}

export function RiskCard({ latitude, longitude, prediction, loading }: RiskCardProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
      if (latitude && longitude && !prediction && !loading) {
          setError('Could not fetch safety prediction.');
          toast({
              title: 'Analysis Failed',
              description: 'The AI service may be temporarily unavailable.',
              variant: 'destructive'
          });
      } else if (prediction) {
        setError(null);
      }
  }, [prediction, loading, latitude, longitude, toast]);


  const getRiskStyles = (riskTag?: 'safe' | 'moderate' | 'high risk') => {
    switch (riskTag) {
      case 'safe':
        return { color: 'bg-green-500', text: 'text-green-500', icon: <ShieldCheck className="h-5 w-5 text-green-500" /> };
      case 'moderate':
        return { color: 'bg-yellow-500', text: 'text-yellow-500', icon: <ShieldAlert className="h-5 w-5 text-yellow-500" /> };
      case 'high risk':
        return { color: 'bg-destructive', text: 'text-destructive', icon: <ShieldAlert className="h-5 w-5 text-destructive" /> };
      default:
        return { color: 'bg-muted', text: 'text-muted-foreground', icon: <Activity className="h-5 w-5 text-muted-foreground" /> };
    }
  };

  const riskStyles = getRiskStyles(prediction?.riskTag);

  if (latitude === null || longitude === null) {
    return (
        <Card className="w-80 shadow-lg backdrop-blur-sm bg-background/80">
            <CardHeader>
                <CardTitle className="text-lg">Safety Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Waiting for location...</p>
                <Skeleton className="h-8 w-full mt-2" />
            </CardContent>
        </Card>
    );
  }

  if (loading && !prediction) {
    return (
      <Card className="w-80 shadow-lg backdrop-blur-sm bg-background/80">
        <CardHeader>
          <CardTitle className="text-lg">Analyzing Safety...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error && !prediction) {
    return (
      <Card className="w-80 shadow-lg border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Analysis Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 shadow-lg backdrop-blur-sm bg-background/80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Safety Analysis</span>
          {riskStyles.icon}
        </CardTitle>
        {prediction?.locationName && (
            <div className="flex items-center text-xs text-muted-foreground pt-2">
                <MapPin className="h-3 w-3 mr-1.5" />
                <span>{prediction.locationName}</span>
            </div>
        )}
        {prediction?.justification && (
            <CardDescription className="pt-2 text-xs">{prediction.justification}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Safety Score</span>
          <span className={cn("text-2xl font-bold", riskStyles.text)}>
            {prediction?.safetyScore ?? 'N/A'}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
                className={cn('h-full rounded-full transition-all duration-500', riskStyles.color)}
                style={{ width: `${prediction?.safetyScore ?? 0}%` }}
            />
        </div>
        <div className="flex items-center justify-between pt-1">
             <span className="font-medium">Risk Level</span>
             {prediction?.riskTag && <Badge variant={prediction.riskTag === 'high risk' ? 'destructive' : 'secondary'} className={cn(
               { 'bg-yellow-500 text-black hover:bg-yellow-500/80': prediction.riskTag === 'moderate' },
               { 'bg-green-500 text-white hover:bg-green-500/80': prediction.riskTag === 'safe' }
              )}>
                {prediction.riskTag.charAt(0).toUpperCase() + prediction.riskTag.slice(1)}
              </Badge>
             }
        </div>
      </CardContent>
    </Card>
  );
}
