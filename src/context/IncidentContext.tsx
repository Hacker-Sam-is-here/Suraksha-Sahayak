'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Incident, IncidentStatus } from '@/lib/types';

interface IncidentContextType {
  incidents: Incident[];
  addIncident: (lat: number, lng: number) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([
    { id: 'demo-1', lat: 27.9881, lng: 86.9250, timestamp: new Date(Date.now() - 3600 * 1000), status: 'New' }
  ]);

  const addIncident = useCallback((lat: number, lng: number) => {
    const newIncident: Incident = {
      id: new Date().getTime().toString(),
      lat,
      lng,
      timestamp: new Date(),
      status: 'New',
    };
    setIncidents(prev => [newIncident, ...prev]);
  }, []);

  const updateIncidentStatus = useCallback((id: string, status: IncidentStatus) => {
    setIncidents(prev =>
      prev.map(inc => (inc.id === id ? { ...inc, status } : inc))
    );
  }, []);

  return (
    <IncidentContext.Provider value={{ incidents, addIncident, updateIncidentStatus }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
}
