export type IncidentStatus = 'New' | 'Acknowledged' | 'Resolved';

export interface Incident {
  id: string;
  lat: number;
  lng: number;
  timestamp: Date;
  status: IncidentStatus;
}

export interface CrimeIncident {
    id: string;
    lat: number;
    lon: number;
    crime_type: string;
    time_estimate: string;
    severity: 'low' | 'medium' | 'high';
    summary: string;
    source_url: string;
}
