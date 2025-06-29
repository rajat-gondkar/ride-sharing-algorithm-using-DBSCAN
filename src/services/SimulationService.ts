import { ISimulationService } from './interfaces';
import { IDataAdapter, IClusterStrategy, IMatchingStrategy, IRoutingEngine } from './interfaces';
import { SimulationParams, RideRequest, Vehicle, Cluster, Assignment } from '../models/types';
import { haversineDistance } from '../utils/geo';

export class SimulationService implements ISimulationService {
  constructor(
    private dataAdapter: IDataAdapter,
    private clusteringStrategy: IClusterStrategy,
    private matchingStrategy: IMatchingStrategy,
    private routingEngine: IRoutingEngine
  ) {}

  async runSimulation(params: SimulationParams): Promise<{
    requests: RideRequest[];
    vehicles: Vehicle[];
    clusters: Cluster[];
    assignments: Assignment[];
  }> {
    // Define the map bounds (approximately 10km x 10km)
    // Using NYC-like coordinates as a base
    const bounds = {
      minLat: 40.7,
      maxLat: 40.8,
      minLng: -74.0,
      maxLng: -73.9
    };
    
    // Generate random requests first
    const requests = this.dataAdapter.generateRequests(params.passengerCount, bounds);
    
    console.log(`Generated ${requests.length} passengers`);
    
    // Generate vehicles positioned near the actual passenger clusters
    const vehicles = this.dataAdapter.generateVehiclesNearPassengers(params.vehicleCount, requests, bounds);
    
    console.log(`Generated ${vehicles.length} vehicles near passenger clusters`);
    
    // Apply clustering to requests
    const clusters = this.clusteringStrategy.cluster(requests, {
      timeWindowMinutes: params.timeWindow,
      maxDistanceKm: params.maxDetourDistance
    });
    
    // Log clustering results
    const multiPassengerClusters = clusters.filter(c => c.requests.length > 1);
    const singlePassengerClusters = clusters.filter(c => c.requests.length === 1);
    const totalClusteredPassengers = multiPassengerClusters.reduce((sum, c) => sum + c.requests.length, 0);
    
    console.log(`Clustering Results:`);
    console.log(`- Total clusters: ${clusters.length}`);
    console.log(`- Multi-passenger clusters: ${multiPassengerClusters.length}`);
    console.log(`- Single-passenger clusters (noise): ${singlePassengerClusters.length}`);
    console.log(`- Passengers in clusters: ${totalClusteredPassengers}/${requests.length} (${(totalClusteredPassengers/requests.length*100).toFixed(1)}%)`);
    
    // Match clusters to vehicles
    const assignments = this.matchingStrategy.match(clusters, vehicles, {
      maxDetourKm: params.maxDetourDistance
    });
    
    // Calculate routes for assignments
    const assignmentsWithRoutes = assignments.map(assignment => {
      const route = this.routingEngine.calculateRoute(assignment.route);
      return { ...assignment, route };
    });
    
    return {
      requests,
      vehicles,
      clusters,
      assignments: assignmentsWithRoutes
    };
  }

  /**
   * Calculate metrics for the simulation results
   */
  calculateMetrics(requests: RideRequest[], assignments: Assignment[]): {
    percentageMatched: number;
    averageDetourDistance: number;
    totalDistanceSaved: number;
  } {
    // Calculate percentage of requests that were matched
    const matchedRequestIds = new Set(assignments.flatMap(a => a.requestIds));
    const percentageMatched = requests.length > 0 
      ? (matchedRequestIds.size / requests.length) * 100
      : 0;
    
    // Calculate average detour distance (simplified for MVP)
    // In a real implementation, this would use the routing engine
    let totalDetourDistance = 0;
    let totalDirectDistance = 0;
    let sharedRideCount = 0;
    
    assignments.forEach(assignment => {
      const route = assignment.route;
      
      // Skip assignments with invalid routes
      if (route.length < 2) return;
      
      // Calculate actual route distance
      let routeDistance = 0;
      for (let i = 0; i < route.length - 1; i++) {
        routeDistance += haversineDistance(route[i], route[i + 1]);
      }
      
      // Calculate direct distances (vehicle to each passenger's destination)
      const matchedRequests = requests.filter(req => assignment.requestIds.includes(req.id));
      
      matchedRequests.forEach(request => {
        const directDistance = haversineDistance(route[0], request.dropoffLocation);
        totalDirectDistance += directDistance;
      });
      
      totalDetourDistance += routeDistance;
      sharedRideCount += matchedRequests.length;
    });
    
    // Calculate average detour distance per passenger
    const averageDetourDistance = sharedRideCount > 0
      ? (totalDetourDistance - totalDirectDistance) / sharedRideCount
      : 0;
    
    // Estimate distance saved through ride-sharing
    // If each passenger took individual trips vs. shared routes
    const totalDistanceSaved = totalDirectDistance - totalDetourDistance;
    
    return {
      percentageMatched,
      averageDetourDistance,
      totalDistanceSaved
    };
  }
} 