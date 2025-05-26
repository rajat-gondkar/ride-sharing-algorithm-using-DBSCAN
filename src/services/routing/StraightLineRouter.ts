import { IRoutingEngine } from '../interfaces';
import { Coordinates } from '../../models/types';
import { haversineDistance } from '../../utils/geo';

/**
 * Simple straight-line router for MVP
 * Uses Haversine distance for distance calculation
 * TODO: Replace with real routing API (Google Maps, OpenStreetMap) in future versions
 */
export class StraightLineRouter implements IRoutingEngine {
  /**
   * Simply returns the input points as the route since this is a straight-line router
   * In a real implementation, this would use a routing API to get actual road paths
   */
  calculateRoute(points: Coordinates[]): Coordinates[] {
    // For MVP, we just return the points as is
    // In future versions, this would call an external routing API
    return points;
  }
  
  /**
   * Calculates the straight-line (Haversine) distance between two points
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    return haversineDistance(from, to);
  }
  
  /**
   * Calculates the total distance of a route
   */
  calculateTotalDistance(route: Coordinates[]): number {
    if (route.length < 2) {
      return 0;
    }
    
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.calculateDistance(route[i], route[i + 1]);
    }
    
    return totalDistance;
  }
  
  /**
   * Calculates a detour distance - the additional distance required to go from origin
   * to destination via a waypoint, compared to going directly
   */
  calculateDetourDistance(origin: Coordinates, waypoint: Coordinates, destination: Coordinates): number {
    const directDistance = this.calculateDistance(origin, destination);
    const detourDistance = this.calculateDistance(origin, waypoint) + this.calculateDistance(waypoint, destination);
    
    return detourDistance - directDistance;
  }
} 