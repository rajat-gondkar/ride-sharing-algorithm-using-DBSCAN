import { IClusterStrategy, ClusterParams } from '../interfaces';
import { Cluster, RideRequest, Coordinates } from '../../models/types';
import { haversineDistance, calculateCentroid } from '../../utils/geo';
import { v4 as uuidv4 } from 'uuid';

/**
 * Basic K-Means clustering implementation for MVP
 * TODO: Replace with DBSCAN algorithm for temporal-spatial clustering in future
 */
export class KMeansClustering implements IClusterStrategy {
  private maxIterations = 10;

  cluster(requests: RideRequest[], params: ClusterParams): Cluster[] {
    if (requests.length === 0) {
      return [];
    }
    
    // Filter requests by time window
    const now = new Date();
    const filteredRequests = requests.filter(req => {
      const diffMinutes = (now.getTime() - req.timestamp.getTime()) / (1000 * 60);
      return diffMinutes <= params.timeWindowMinutes;
    });
    
    if (filteredRequests.length === 0) {
      return [];
    }

    // Determine number of clusters based on request count
    // We aim for 2-3 requests per cluster on average
    const k = Math.max(1, Math.ceil(filteredRequests.length / 3));
    
    // Initialize centroids randomly from the pickup locations
    let centroids: Coordinates[] = this.initializeCentroids(filteredRequests, k);
    
    // Track cluster assignments
    let clusters: Map<number, RideRequest[]> = new Map();
    
    // Iterative k-means
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // Reset clusters
      clusters = new Map();
      for (let i = 0; i < k; i++) {
        clusters.set(i, []);
      }
      
      // Assign each request to the nearest centroid
      for (const request of filteredRequests) {
        const nearestCentroidIndex = this.findNearestCentroidIndex(request.pickupLocation, centroids);
        const clusterRequests = clusters.get(nearestCentroidIndex) || [];
        clusterRequests.push(request);
        clusters.set(nearestCentroidIndex, clusterRequests);
      }
      
      // Update centroids
      const newCentroids: Coordinates[] = [];
      
      for (let i = 0; i < k; i++) {
        const clusterRequests = clusters.get(i) || [];
        
        if (clusterRequests.length > 0) {
          const pickupLocations = clusterRequests.map(r => r.pickupLocation);
          newCentroids[i] = calculateCentroid(pickupLocations);
        } else {
          // Keep the old centroid if no points assigned
          newCentroids[i] = centroids[i];
        }
      }
      
      // Check for convergence
      const centroidsChanged = this.haveCentroidsChanged(centroids, newCentroids, params.maxDistanceKm / 10);
      
      // Update centroids for next iteration
      centroids = newCentroids;
      
      if (!centroidsChanged) {
        break;
      }
    }
    
    // Convert to our Cluster interface, excluding empty clusters
    return Array.from(clusters.entries())
      .filter(([_, requests]) => requests.length > 0)
      .map(([index, requests]) => ({
        id: uuidv4(),
        centroid: centroids[index],
        requests
      }));
  }
  
  private initializeCentroids(requests: RideRequest[], k: number): Coordinates[] {
    const pickupLocations = requests.map(r => r.pickupLocation);
    
    // Simple random initialization for MVP
    // TODO: Use k-means++ for better initialization in future versions
    const shuffled = [...pickupLocations].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, k);
  }
  
  private findNearestCentroidIndex(location: Coordinates, centroids: Coordinates[]): number {
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    centroids.forEach((centroid, index) => {
      const distance = haversineDistance(location, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    return nearestIndex;
  }
  
  private haveCentroidsChanged(oldCentroids: Coordinates[], newCentroids: Coordinates[], threshold: number): boolean {
    return oldCentroids.some((oldCentroid, index) => 
      haversineDistance(oldCentroid, newCentroids[index]) > threshold
    );
  }
} 