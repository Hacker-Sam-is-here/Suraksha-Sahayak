'use client';

import { useIncidents } from '@/context/IncidentContext';
import { MapComponent } from './MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { IncidentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

export function AdminDashboard() {
  const { incidents, updateIncidentStatus } = useIncidents();

  const getStatusBadgeVariant = (status: IncidentStatus) => {
    switch (status) {
      case 'New':
        return 'destructive';
      case 'Acknowledged':
        return 'secondary';
      case 'Resolved':
        return 'default';
      default:
        return 'default';
    }
  };
  
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6">
      <div className="lg:col-span-2 h-[40vh] lg:h-full rounded-lg overflow-hidden shadow-md">
        <MapComponent incidents={incidents} />
      </div>
      <Card className="lg:col-span-1 h-[60vh] lg:h-full overflow-hidden flex flex-col shadow-md">
        <CardHeader>
          <CardTitle>Active Incidents ({incidents.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
            <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {incidents.length > 0 ? incidents.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map((incident) => (
                    <TableRow key={incident.id}>
                    <TableCell className="font-medium text-xs">
                        {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-xs">{incident.timestamp.toLocaleTimeString()}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(incident.status)} className={cn(
                          'text-xs',
                          { 'bg-yellow-500 text-black hover:bg-yellow-500/80': incident.status === 'Acknowledged' },
                          { 'bg-green-600 text-white hover:bg-green-600/80': incident.status === 'Resolved' }
                        )}>
                        {incident.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateIncidentStatus(incident.id, 'Acknowledged')}>
                            Acknowledge
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateIncidentStatus(incident.id, 'Resolved')}>
                            Mark as Resolved
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No active incidents.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
