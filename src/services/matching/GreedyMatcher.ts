import { IMatchingStrategy } from '../interfaces';
import { Cluster, Vehicle, Assignment, Coordinates } from '../../models/types';
import { haversineDistance } from '../../utils/geo';

/**
 * Greedy matching strategy for MVP
 * Assigns clusters to the nearest available vehicle with sufficient capacity
 * TODO: Replace with genetic algorithm or reinforcement learning in future versions
 */
export class GreedyMatcher implements IMatchingStrategy {
  match(clusters: Cluster[], vehicles: Vehicle[], constraints: { maxDetourKm: number }): Assignment[] {
    // Create a copy of vehicles to track availability
    const availableVehicles = [...vehicles].map(v => ({
      ...v,
      // Create a deep copy to prevent modifying the original
      availableSeats: v.availableSeats,
      assignedClusters: [] as Cluster[]
    }));
    
    // Sort clusters by size (largest first) to prioritize larger groups
    const sortedClusters = [...clusters].sort(
      (a, b) => b.requests.length - a.requests.length
    );
    
    // For each cluster, find the nearest vehicle with capacity
    for (const cluster of sortedClusters) {
      // Skip clusters that are too large for any single vehicle
      if (cluster.requests.length > Math.max(...availableVehicles.map(v => v.availableSeats))) {
        continue;
      }
      
      // Find nearest vehicle with sufficient capacity
      let bestVehicleIndex = -1;
      let minDistance = Infinity;
      
      for (let i = 0; i < availableVehicles.length; i++) {
        const vehicle = availableVehicles[i];
        
        // Skip vehicles without sufficient capacity
        if (vehicle.availableSeats < cluster.requests.length) {
          continue;
        }
        
        const distance = haversineDistance(vehicle.location, cluster.centroid);
        
        // Check if this is within max detour constraint
        if (distance <= constraints.maxDetourKm && distance < minDistance) {
          minDistance = distance;
          bestVehicleIndex = i;
        }
      }
      
      // Assign cluster to the best vehicle if found
      if (bestVehicleIndex !== -1) {
        const bestVehicle = availableVehicles[bestVehicleIndex];
        bestVehicle.availableSeats -= cluster.requests.length;
        bestVehicle.assignedClusters.push(cluster);
      }
    }
    
    // Convert the assignments to the Assignment interface
    return availableVehicles
      .filter(vehicle => vehicle.assignedClusters.length > 0)
      .map(vehicle => {
        // Extract all request IDs from the assigned clusters
        const requestIds = vehicle.assignedClusters
          .flatMap(cluster => cluster.requests.map(req => req.id));
        
        // Generate a simple route for MVP: vehicle → pickup → dropoff
        const route = this.generateSimpleRoute(vehicle, vehicle.assignedClusters);
        
        return {
          vehicleId: vehicle.id,
          requestIds,
          route
        };
      });
  }
  
  /**
   * Generate a simple route for MVP: vehicle → pickup points → dropoff points
   * In a real implementation, this would use a proper routing algorithm
   */
  private generateSimpleRoute(vehicle: Vehicle & { assignedClusters: Cluster[] }, clusters: Cluster[]): Coordinates[] {
    const route: Coordinates[] = [vehicle.location];
    
    // Add all pickup locations to the route
    const pickupLocations = clusters.flatMap(cluster => 
      cluster.requests.map(req => req.pickupLocation)
    );
    route.push(...pickupLocations);
    
    // Add all dropoff locations to the route
    const dropoffLocations = clusters.flatMap(cluster => 
      cluster.requests.map(req => req.dropoffLocation)
    );
    route.push(...dropoffLocations);
    
    return route;
  }
} 