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
  private readonly MAX_SPATIAL_DISTANCE_KM = 4; // Normalize to max 4km (adjusted for more realistic clusters)
  private readonly MAX_TEMPORAL_DISTANCE_MIN = 12; // Normalize to max 12 minutes (adjusted for more realistic temporal clustering)

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
    
    // DBSCAN parameters - adjusted for more realistic clustering
    // Make epsilon more flexible based on the number of requests
    const baseEpsilon = 0.22;
    const adaptiveEpsilon = Math.min(baseEpsilon * (1 + filteredRequests.length / 100), 0.35);
    const epsilon = adaptiveEpsilon; // Epsilon defines the radius of the neighborhood
    const minPoints = 2; // Minimum points in a neighborhood to form a cluster
    
    console.log(`DBSCAN Parameters: epsilon=${epsilon.toFixed(3)}, minPoints=${minPoints}, requests=${filteredRequests.length}`);
    
    // Initialize clusters and classification array
    const clusters: Cluster[] = [];
    const classifications: number[] = new Array(filteredRequests.length).fill(this.UNCLASSIFIED);
    
    // Track noise points that get absorbed into clusters
    const absorbedNoisePoints: number[] = [];
    
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
        console.log(`Point ${i} marked as NOISE (${neighborIndices.length} neighbors)`);
        continue;
      }
      
      // Start a new cluster
      clusterId++;
      classifications[i] = clusterId;
      console.log(`Starting cluster ${clusterId} from point ${i} with ${neighborIndices.length} neighbors`);
      
      // Expand the cluster
      this.expandCluster(i, neighborIndices, clusterId, classifications, filteredRequests, epsilon, minPoints, params, absorbedNoisePoints);
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
    
    console.log(`DBSCAN Results: ${clusterId} clusters, ${noiseIndices.length} noise points out of ${filteredRequests.length} total requests`);
    console.log(`Absorbed noise points: ${absorbedNoisePoints.length}`);
    
    for (const idx of noiseIndices) {
      const request = filteredRequests[idx];
      console.log(`Creating single-passenger cluster for noise point ${idx}`);
      clusters.push({
        id: uuidv4(),
        centroid: { ...request.pickupLocation },
        requests: [request]
      });
    }
    
    // Final verification: ensure all requests are accounted for
    const totalClusteredRequests = clusters.reduce((sum, cluster) => sum + cluster.requests.length, 0);
    const unaccountedRequests = filteredRequests.length - totalClusteredRequests;
    
    if (unaccountedRequests > 0) {
      console.warn(`WARNING: ${unaccountedRequests} requests are not accounted for in any cluster!`);
      
      // Find unaccounted requests
      const clusteredRequestIds = new Set(clusters.flatMap(c => c.requests.map(r => r.id)));
      const unaccountedIndices = filteredRequests
        .map((req, idx) => ({ req, idx }))
        .filter(({ req }) => !clusteredRequestIds.has(req.id))
        .map(({ idx }) => idx);
      
      console.warn(`Unaccounted request indices: ${unaccountedIndices.join(', ')}`);
      
      // Create individual clusters for unaccounted requests
      for (const idx of unaccountedIndices) {
        const request = filteredRequests[idx];
        console.log(`Creating emergency single-passenger cluster for unaccounted request ${idx}`);
        clusters.push({
          id: uuidv4(),
          centroid: { ...request.pickupLocation },
          requests: [request]
        });
      }
    }
    
    console.log(`Final clusters: ${clusters.length} total (${clusterId} multi-passenger + ${noiseIndices.length} single-passenger)`);
    console.log(`Total requests in clusters: ${totalClusteredRequests}/${filteredRequests.length}`);
    
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
    params: ClusterParams,
    absorbedNoisePoints: number[]
  ): void {
    // Process all seeds (neighbors of the core point)
    let seeds = [...neighborIndices];
    let seedIndex = 0;
    
    while (seedIndex < seeds.length) {
      const currentPointIndex = seeds[seedIndex];
      
      // If point was noise, add it to the current cluster
      if (classifications[currentPointIndex] === this.NOISE) {
        classifications[currentPointIndex] = clusterId;
        absorbedNoisePoints.push(currentPointIndex);
        console.log(`Noise point ${currentPointIndex} absorbed into cluster ${clusterId}`);
      }
      
      // If point is not yet classified, add it to the current cluster
      if (classifications[currentPointIndex] === this.UNCLASSIFIED) {
        classifications[currentPointIndex] = clusterId;
        console.log(`Unclassified point ${currentPointIndex} added to cluster ${clusterId}`);
        
        // Find all neighbors of the current point
        const currentNeighbors = this.regionQuery(
          currentPointIndex, 
          requests, 
          epsilon, 
          params
        );
        
        // If current point is a core point, add its neighbors to the seeds list
        if (currentNeighbors.length >= minPoints) {
          console.log(`Point ${currentPointIndex} is a core point with ${currentNeighbors.length} neighbors, expanding cluster`);
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
    // Use a more flexible spatial normalization for ride-sharing
    const spatialThreshold = Math.min(this.MAX_SPATIAL_DISTANCE_KM, maxDistanceKm);
    const normalizedSpatialDistance = Math.min(spatialDistance / spatialThreshold, 1);
    
    const normalizedTemporalDistance = Math.min(
      temporalDistance / this.MAX_TEMPORAL_DISTANCE_MIN, 
      1
    );
    
    // Combine spatial and temporal distances (with spatial having more weight)
    // Weight distribution: 80% spatial, 20% temporal
    const combinedDistance = (normalizedSpatialDistance * 0.8) + (normalizedTemporalDistance * 0.2);
    
    // Debug logging for distance calculation
    if (spatialDistance < 0.5 && temporalDistance < 5) {
      console.log(`Distance calculation: spatial=${spatialDistance.toFixed(3)}km, temporal=${temporalDistance.toFixed(1)}min, combined=${combinedDistance.toFixed(3)}`);
    }
    
    return combinedDistance;
  }
} 