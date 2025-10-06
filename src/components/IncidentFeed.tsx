'use client'

import type { PredictUnsafeZonesOutput } from "@/ai/flows/predict-unsafe-zones";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { AlertTriangle, CloudRain, ShieldAlert, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface IncidentFeedProps {
    prediction: PredictUnsafeZonesOutput | null;
}

export function IncidentFeed({ prediction }: IncidentFeedProps) {
    
    if (!prediction) {
        return (
            <Card className="w-80 shadow-lg backdrop-blur-sm bg-background/80">
                <CardHeader>
                    <CardTitle className="text-base">Area Scan</CardTitle>
                </CardHeader>
                <CardContent className="h-40">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    const crimeAlerts = (prediction.crimeHotspots || []).map(crime => ({
        id: crime.id,
        type: 'crime' as const,
        title: crime.crime_type.replace(/_/g, ' '),
        description: crime.summary,
        severity: crime.severity,
        source_url: crime.source_url,
    }));
    
    const environmentalAlerts = (prediction.environmentalHazards || []).map(hazard => ({
        id: hazard.id,
        type: hazard.type,
        title: hazard.title,
        description: hazard.description,
        severity: hazard.severity,
        source_url: null,
    }));

    const allAlerts = [...crimeAlerts, ...environmentalAlerts];

    const getIcon = (type: 'crime' | 'landslide' | 'weather', title: string) => {
        if (type === 'crime') return <ShieldAlert className="h-5 w-5" />;
        if (type === 'landslide') return <Mountain className="h-5 w-5" />;
        if (type === 'weather') return <CloudRain className="h-5 w-5" />;
        return <AlertTriangle className="h-5 w-5" />;
    };
    
    const getColor = (severity: 'low' | 'medium' | 'high') => {
        switch(severity) {
            case 'low': return 'text-yellow-500';
            case 'medium': return 'text-orange-500';
            case 'high': return 'text-red-600';
            default: return 'text-muted-foreground';
        }
    }

    const AlertItem = ({ alert }: { alert: (typeof allAlerts)[0] }) => {
        const content = (
            <div className="flex items-start gap-3">
                <div className={cn("mt-1", getColor(alert.severity))}>
                    {getIcon(alert.type, alert.title)}
                </div>
                <div>
                    <p className="text-sm font-semibold capitalize">{alert.title}</p>
                    {alert.description && <p className="text-xs text-muted-foreground">{alert.description}</p>}
                </div>
            </div>
        );

        if (alert.source_url) {
            return (
                <a 
                    href={alert.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                    aria-label={`Read more about ${alert.title}`}
                >
                   {content}
                </a>
            )
        }
        return <div className="p-2 -m-2">{content}</div>;
    }

    return (
        <Card className="w-80 shadow-lg backdrop-blur-sm bg-background/80">
            <CardHeader>
                <CardTitle className="text-base">Area Scan</CardTitle>
                <CardDescription className="text-xs">Live incidents and safety factors.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-40">
                    <div className="space-y-4 pr-4">
                       {allAlerts.length > 0 ? allAlerts.map(alert => (
                           <AlertItem key={alert.id} alert={alert} />
                       )) : (
                           <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                               No recent alerts in this area.
                           </div>
                       )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
