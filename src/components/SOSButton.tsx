'use client';

import { Siren, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIncidents } from '@/context/IncidentContext';
import { useLocation } from '@/hooks/use-location';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SOSButton() {
  const { addIncident } = useIncidents();
  const { location, error } = useLocation();
  const { toast } = useToast();

  const handleSOS = () => {
    if (location) {
      addIncident(location.lat, location.lng);
      toast({
        title: 'SOS Alert Sent!',
        description: 'Authorities have been notified with your live location.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Could not send SOS',
        description: error || 'Unable to get your current location. Please enable location services.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          variant="destructive"
          className="fixed bottom-6 right-6 z-20 h-20 w-20 rounded-full bg-accent shadow-2xl hover:bg-accent/90 focus:ring-4 focus:ring-accent/50 group"
          aria-label="Send SOS Alert"
        >
          <div className="absolute inset-0 rounded-full bg-accent animate-ping-slow group-hover:animate-ping"></div>
          { !location && !error ? <Loader2 className="h-10 w-10 text-accent-foreground animate-spin" /> : <Siren className="h-10 w-10 text-accent-foreground" /> }
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm SOS Alert</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately send your current location to the authorities for an emergency response. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSOS} className="bg-destructive hover:bg-destructive/90">
            Confirm SOS
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
