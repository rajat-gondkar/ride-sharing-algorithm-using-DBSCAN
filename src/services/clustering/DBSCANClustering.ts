// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IClusterStrategy, ClusterParams } from '../interfaces';
import { Cluster, RideRequest } from '../../models/types';
import { v4 as uuidv4 } from 'uuid';
import { haversineDistance } from '../../utils/geo';

/**
 * DBSCAN (Density-Based Spatial Clustering of Applications with Noise) implementation
 * for clustering ride requests based on their spatio-temporal proximity.
 * 
 * Advantages over k-means clustering:
 * 1. Does not require specifying the number of clusters in advance
 * 2. Can find arbitrarily shaped clusters
 * 3. Has a notion of noise (outliers)
 * 4. Works well with varying density clusters
 */
export class DBSCANClustering implements IClusterStrategy {
  // Classification constants
  private readonly UNCLASSIFIED = -1;
  private readonly NOISE = -2;
  
  // Distance normalization (for combining spatial and temporal distances)
  private readonly MAX_SPATIAL_DISTANCE_KM = 10; // Normalize to max 10km
  private readonly MAX_TEMPORAL_DISTANCE_MIN = 30; // Normalize to max 30 minutes

  /**
   * Cluster ride requests using DBSCAN algorithm
   * 
   * @param requests Array of ride requests to cluster
   * @param params Clustering parameters (time window, max distance)
   * @returns Array of clusters
   */
  cluster(requests: RideRequest[], params: ClusterParams): Cluster[] {
    // Filter requests to the specified time window
    const now = new Date();
    const cutoff = new Date(now.getTime() - params.timeWindowMinutes * 60 * 1000);
    
    const filteredRequests = requests.filter(request => request.timestamp >= cutoff);
    
    if (filteredRequests.length === 0) {
      return [];
    }
    
    // DBSCAN parameters
    const epsilon = 0.3; // Epsilon defines the radius of the neighborhood (normalized value)
    const minPoints = 2; // Minimum points in a neighborhood to form a cluster
    
    // Initialize clusters and classification array
    const clusters: Cluster[] = [];
    const classifications: number[] = new Array(filteredRequests.length).fill(this.UNCLASSIFIED);
    
    // Run DBSCAN algorithm
    let clusterId = 0;
    
    for (let i = 0; i < filteredRequests.length; i++) {
      // Skip already classified points
      if (classifications[i] !== this.UNCLASSIFIED) {
        continue;
      }
      
      // Find all points in the neighborhood
      const neighborIndices = this.regionQuery(i, filteredRequests, epsilon, params);
      
      // Check if point is a core point (has enough neighbors)
      if (neighborIndices.length < minPoints) {
        classifications[i] = this.NOISE;
        continue;
      }
      
      // Start a new cluster
      clusterId++;
      classifications[i] = clusterId;
      
      // Expand the cluster
      this.expandCluster(i, neighborIndices, clusterId, classifications, filteredRequests, epsilon, minPoints, params);
    }
    
    // Convert classification results to cluster objects
    for (let cId = 1; cId <= clusterId; cId++) {
      const clusterRequestIndices = classifications
        .map((val, idx) => ({ val, idx }))
        .filter(item => item.val === cId)
        .map(item => item.idx);
      
      const clusterRequests = clusterRequestIndices.map(idx => filteredRequests[idx]);
      
      // Skip empty clusters
      if (clusterRequests.length === 0) continue;
      
      // Calculate cluster centroid (average of pickup locations)
      const centroid = {
        lat: clusterRequests.reduce((sum, req) => sum + req.pickupLocation.lat, 0) / clusterRequests.length,
        lng: clusterRequests.reduce((sum, req) => sum + req.pickupLocation.lng, 0) / clusterRequests.length
      };
      
      clusters.push({
        id: uuidv4(),
        centroid,
        requests: clusterRequests
      });
    }
    
    // Handle noise points as individual clusters
    const noiseIndices = classifications
      .map((val, idx) => ({ val, idx }))
      .filter(item => item.val === this.NOISE)
      .map(item => item.idx);
    
    for (const idx of noiseIndices) {
      const request = filteredRequests[idx];
      clusters.push({
        id: uuidv4(),
        centroid: { ...request.pickupLocation },
        requests: [request]
      });
    }
    
    return clusters;
  }
  
  /**
   * Find all points in the epsilon-neighborhood of the point at pointIndex
   */
  private regionQuery(
    pointIndex: number, 
    requests: RideRequest[], 
    epsilon: number, 
    params: ClusterParams
  ): number[] {
    const neighbors: number[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      if (i === pointIndex) continue;
      
      const distance = this.calculateSpatioTemporalDistance(
        requests[pointIndex], 
        requests[i], 
        params.maxDistanceKm
      );
      
      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }
  
  /**
   * Expand a cluster from a core point
   */
  private expandCluster(
    corePointIndex: number,
    neighborIndices: number[],
    clusterId: number,
    classifications: number[],
    requests: RideRequest[],
    epsilon: number,
    minPoints: number,
    params: ClusterParams
  ): void {
    // Process all seeds (neighbors of the core point)
    let seeds = [...neighborIndices];
    let seedIndex = 0;
    
    while (seedIndex < seeds.length) {
      const currentPointIndex = seeds[seedIndex];
      
      // If point was noise, add it to the current cluster
      if (classifications[currentPointIndex] === this.NOISE) {
        classifications[currentPointIndex] = clusterId;
      }
      
      // If point is not yet classified, add it to the current cluster
      if (classifications[currentPointIndex] === this.UNCLASSIFIED) {
        classifications[currentPointIndex] = clusterId;
        
        // Find all neighbors of the current point
        const currentNeighbors = this.regionQuery(
          currentPointIndex, 
          requests, 
          epsilon, 
          params
        );
        
        // If current point is a core point, add its neighbors to the seeds list
        if (currentNeighbors.length >= minPoints) {
          seeds = this.mergeArrays(seeds, currentNeighbors);
        }
      }
      
      seedIndex++;
    }
  }
  
  /**
   * Merge arrays without duplicates
   */
  private mergeArrays(arr1: number[], arr2: number[]): number[] {
    const result = [...arr1];
    
    for (const value of arr2) {
      if (!result.includes(value)) {
        result.push(value);
      }
    }
    
    return result;
  }
  
  /**
   * Calculate a normalized distance that combines both spatial and temporal components
   * Returns a value between 0 and 1, where:
   * - 0 means requests are identical in space and time
   * - 1 means requests are at max distance in space and/or time
   */
  private calculateSpatioTemporalDistance(
    request1: RideRequest, 
    request2: RideRequest, 
    maxDistanceKm: number
  ): number {
    // Calculate spatial distance (in km)
    const spatialDistance = haversineDistance(
      request1.pickupLocation, 
      request2.pickupLocation
    );
    
    // Calculate temporal distance (in minutes)
    const temporalDistance = Math.abs(
      (request1.timestamp.getTime() - request2.timestamp.getTime()) / (60 * 1000)
    );
    
    // Normalize distances to [0, 1] range
    const normalizedSpatialDistance = Math.min(
      spatialDistance / Math.min(this.MAX_SPATIAL_DISTANCE_KM, maxDistanceKm), 
      1
    );
    
    const normalizedTemporalDistance = Math.min(
      temporalDistance / this.MAX_TEMPORAL_DISTANCE_MIN, 
      1
    );
    
    // Combine spatial and temporal distances (with spatial having more weight)
    // Weight distribution: 70% spatial, 30% temporal
    return (normalizedSpatialDistance * 0.7) + (normalizedTemporalDistance * 0.3);
  }
} 