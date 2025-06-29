import { ISimulationService } from './interfaces';
import { IDataAdapter, IClusterStrategy, IMatchingStrategy, IRoutingEngine } from './interfaces';
import { SimulationParams, RideRequest, Vehicle, Cluster, Assignment, Coordinates } from '../models/types';
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
    let totalSequentialDistance = 0; // Realistic sequential route distance
    let sharedRideCount = 0;
    
    assignments.forEach(assignment => {
      const route = assignment.route;
      
      // Skip assignments with invalid routes
      if (route.length < 2) return;
      
      // Calculate actual optimized route distance
      let optimizedRouteDistance = 0;
      for (let i = 0; i < route.length - 1; i++) {
        optimizedRouteDistance += haversineDistance(route[i], route[i + 1]);
      }
      
      // Calculate realistic sequential route distance
      // This simulates what would happen if the vehicle had to pick up and drop off passengers one by one
      const matchedRequests = requests.filter(req => assignment.requestIds.includes(req.id));
      const sequentialDistance = this.calculateSequentialRouteDistance(route[0], matchedRequests);
      totalSequentialDistance += sequentialDistance;
      
      totalDetourDistance += optimizedRouteDistance;
      sharedRideCount += matchedRequests.length;
    });
    
    // Calculate average detour distance per passenger
    const averageDetourDistance = sharedRideCount > 0
      ? (totalDetourDistance - totalSequentialDistance) / sharedRideCount
      : 0;
    
    // Realistic distance saved calculation (sequential vs optimized route)
    const totalDistanceSaved = totalSequentialDistance - totalDetourDistance;
    
    return {
      percentageMatched,
      averageDetourDistance,
      totalDistanceSaved
    };
  }

  /**
   * Calculate the distance for a realistic sequential pickup/dropoff route
   * This simulates what would happen if the vehicle had to serve passengers one by one
   * 
   * Route pattern: Vehicle → Pickup1 → Dropoff1 → Pickup2 → Dropoff2 → Pickup3 → Dropoff3...
   * 
   * @param vehicleLocation Starting location of the vehicle
   * @param requests Array of ride requests to be served
   * @returns Total distance for the sequential route
   */
  private calculateSequentialRouteDistance(vehicleLocation: Coordinates, requests: RideRequest[]): number {
    if (requests.length === 0) return 0;
    
    let totalDistance = 0;
    let currentLocation = vehicleLocation;
    
    // Sort requests by pickup time for more realistic sequencing
    const sortedRequests = [...requests].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (const request of sortedRequests) {
      // Vehicle travels from current location to pickup
      const pickupDistance = haversineDistance(currentLocation, request.pickupLocation);
      totalDistance += pickupDistance;
      
      // Vehicle travels from pickup to dropoff
      const dropoffDistance = haversineDistance(request.pickupLocation, request.dropoffLocation);
      totalDistance += dropoffDistance;
      
      // Update current location to dropoff point
      currentLocation = request.dropoffLocation;
    }
    
    return totalDistance;
  }
} 