import { Cluster, RideRequest, Vehicle, Assignment, Coordinates, SimulationParams } from '../models/types';

// Interface for data adapters (to allow for different data sources in the future)
export interface IDataAdapter {
  generateRequests(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): RideRequest[];
  generateVehicles(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Vehicle[];
  generateVehiclesNearPassengers(count: number, requests: RideRequest[], bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Vehicle[];
}

// Parameters for clustering
export interface ClusterParams {
  timeWindowMinutes: number;
  maxDistanceKm: number;
}

// Interface for clustering algorithms
export interface IClusterStrategy {
  cluster(requests: RideRequest[], params: ClusterParams): Cluster[];
}

// Interface for matching algorithms
export interface IMatchingStrategy {
  match(clusters: Cluster[], vehicles: Vehicle[], constraints: { maxDetourKm: number }): Assignment[];
}

// Interface for routing engines
export interface IRoutingEngine {
  calculateRoute(points: Coordinates[]): Coordinates[];
  calculateDistance(from: Coordinates, to: Coordinates): number;
}

// Interface for the simulation orchestrator
export interface ISimulationService {
  runSimulation(params: SimulationParams): Promise<{
    requests: RideRequest[];
    vehicles: Vehicle[];
    clusters: Cluster[];
    assignments: Assignment[];
  }>;
} 