import { LatLngTuple } from 'leaflet';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RideRequest {
  id: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  timestamp: Date;
}

export interface Vehicle {
  id: string;
  location: Coordinates;
  capacity: number;
  availableSeats: number;
  currentRoute: Coordinates[];
}

export interface Cluster {
  id: string;
  centroid: Coordinates;
  requests: RideRequest[];
}

export interface Assignment {
  vehicleId: string;
  requestIds: string[];
  route: Coordinates[];
}

export interface SimulationParams {
  passengerCount: number;
  vehicleCount: number;
  maxDetourDistance: number; // in km
  timeWindow: number; // in minutes
}

export interface SimulationResult {
  assignments: Assignment[];
  unassignedRequests: RideRequest[];
  metrics: {
    percentageMatched: number;
    averageDetourDistance: number;
    totalDistanceSaved: number;
  };
}

// Convert from our Coordinates to Leaflet's LatLngTuple
export const toLatLng = (coord: Coordinates): LatLngTuple => [coord.lat, coord.lng]; 