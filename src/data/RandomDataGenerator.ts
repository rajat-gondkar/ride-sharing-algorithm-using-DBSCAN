import { IDataAdapter } from '../services/interfaces';
import { RideRequest, Vehicle } from '../models/types';
import { randomLocation, calculateCentroid } from '../utils/geo';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cluster-aware data generator that creates realistic ride-sharing scenarios
 * Generates passengers in clusters and positions vehicles strategically
 */
export class RandomDataGenerator implements IDataAdapter {
  
  /**
   * Generate a specified number of ride requests in clusters within given bounds
   */
  generateRequests(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): RideRequest[] {
    // Safety check for valid count
    if (count <= 0) {
      console.warn('Invalid passenger count, using default of 10');
      count = 10;
    }
    
    const passengersPerCluster = 3 + Math.floor(Math.random() * 2); // 3-4 passengers per cluster
    const numClusters = Math.max(1, Math.floor(count * 0.8 / passengersPerCluster)); // Ensure at least 1 cluster
    const clusteredPassengers = numClusters * passengersPerCluster;
    const noisePassengers = Math.max(0, count - clusteredPassengers);
    
    console.log(`Generating ${numClusters} clusters with ${passengersPerCluster} passengers each, plus ${noisePassengers} noise passengers`);
    
    return this.generatePassengerRequests(count, bounds);
  }
  
  /**
   * Generate a specified number of vehicles positioned near passenger clusters
   */
  generateVehicles(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Vehicle[] {
    // Safety check for valid count
    if (count <= 0) {
      console.warn('Invalid vehicle count, using default of 3');
      count = 3;
    }
    
    const vehicles: Vehicle[] = [];
    
    // Generate passenger requests to determine actual cluster centers
    const passengerRequests = this.generatePassengerRequests(Math.max(20, count * 3), bounds);
    
    // Extract actual cluster centers from passenger locations
    const clusterCenters = this.extractActualClusterCenters(passengerRequests, count);
    
    console.log(`Extracted ${clusterCenters.length} actual cluster centers for vehicle positioning`);
    
    // Ensure at least one vehicle per cluster center
    const vehiclesPerCluster = Math.max(1, Math.floor(count / clusterCenters.length));
    const remainingVehicles = count - (clusterCenters.length * vehiclesPerCluster);
    
    console.log(`Positioning ${vehiclesPerCluster} vehicles per cluster, with ${remainingVehicles} additional vehicles`);
    
    // Generate vehicles near actual cluster centers
    let vehicleIndex = 0;
    
    // First, ensure at least one vehicle per cluster
    for (let clusterIndex = 0; clusterIndex < clusterCenters.length && vehicleIndex < count; clusterIndex++) {
      const clusterCenter = clusterCenters[clusterIndex];
      
      // Position vehicle near this cluster center
      const location = this.generateLocationNearCenter(clusterCenter, 0.4); // 400m radius
      
      // Each vehicle has a capacity between 4-6 passengers
      const capacity = 4 + Math.floor(Math.random() * 3);
      
      vehicles.push({
        id: uuidv4(),
        location,
        capacity,
        availableSeats: capacity,
        currentRoute: []
      });
      
      vehicleIndex++;
    }
    
    // Add additional vehicles per cluster if we have more vehicles than clusters
    for (let clusterIndex = 0; clusterIndex < clusterCenters.length && vehicleIndex < count; clusterIndex++) {
      const clusterCenter = clusterCenters[clusterIndex];
      
      for (let extraVehicle = 1; extraVehicle < vehiclesPerCluster && vehicleIndex < count; extraVehicle++) {
        const location = this.generateLocationNearCenter(clusterCenter, 0.6); // 600m radius for additional vehicles
        
        const capacity = 4 + Math.floor(Math.random() * 3);
        
        vehicles.push({
          id: uuidv4(),
          location,
          capacity,
          availableSeats: capacity,
          currentRoute: []
        });
        
        vehicleIndex++;
      }
    }
    
    // Add remaining vehicles near random cluster centers
    for (let i = 0; i < remainingVehicles && vehicleIndex < count; i++) {
      let location: { lat: number; lng: number };
      
      if (clusterCenters.length > 0) {
        const randomCenter = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        location = this.generateLocationNearCenter(randomCenter, 0.8); // 800m radius for remaining vehicles
      } else {
        // Fallback to random location if no cluster centers found
        location = randomLocation(bounds);
      }
      
      const capacity = 4 + Math.floor(Math.random() * 3);
      
      vehicles.push({
        id: uuidv4(),
        location,
        capacity,
        availableSeats: capacity,
        currentRoute: []
      });
      
      vehicleIndex++;
    }
    
    return vehicles;
  }
  
  /**
   * Generate vehicles positioned near actual passenger clusters
   */
  generateVehiclesNearPassengers(count: number, requests: RideRequest[], bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Vehicle[] {
    // Safety check for valid count
    if (count <= 0) {
      console.warn('Invalid vehicle count, using default of 3');
      count = 3;
    }
    
    const vehicles: Vehicle[] = [];
    
    // Extract actual cluster centers from the provided passenger requests
    const clusterCenters = this.extractActualClusterCenters(requests, count);
    
    console.log(`Extracted ${clusterCenters.length} actual cluster centers from ${requests.length} passengers for vehicle positioning`);
    
    // Ensure at least one vehicle per cluster center
    const vehiclesPerCluster = Math.max(1, Math.floor(count / clusterCenters.length));
    const remainingVehicles = count - (clusterCenters.length * vehiclesPerCluster);
    
    console.log(`Positioning ${vehiclesPerCluster} vehicles per cluster, with ${remainingVehicles} additional vehicles`);
    
    // Generate vehicles near actual cluster centers
    let vehicleIndex = 0;
    
    // First, ensure at least one vehicle per cluster
    for (let clusterIndex = 0; clusterIndex < clusterCenters.length && vehicleIndex < count; clusterIndex++) {
      const clusterCenter = clusterCenters[clusterIndex];
      
      // Position vehicle near this cluster center
      const location = this.generateLocationNearCenter(clusterCenter, 0.4); // 400m radius
      
      // Each vehicle has a capacity between 4-6 passengers
      const capacity = 4 + Math.floor(Math.random() * 3);
      
      vehicles.push({
        id: uuidv4(),
        location,
        capacity,
        availableSeats: capacity,
        currentRoute: []
      });
      
      vehicleIndex++;
    }
    
    // Add additional vehicles per cluster if we have more vehicles than clusters
    for (let clusterIndex = 0; clusterIndex < clusterCenters.length && vehicleIndex < count; clusterIndex++) {
      const clusterCenter = clusterCenters[clusterIndex];
      
      for (let extraVehicle = 1; extraVehicle < vehiclesPerCluster && vehicleIndex < count; extraVehicle++) {
        const location = this.generateLocationNearCenter(clusterCenter, 0.6); // 600m radius for additional vehicles
        
        const capacity = 4 + Math.floor(Math.random() * 3);
        
        vehicles.push({
          id: uuidv4(),
          location,
          capacity,
          availableSeats: capacity,
          currentRoute: []
        });
        
        vehicleIndex++;
      }
    }
    
    // Add remaining vehicles near random cluster centers
    for (let i = 0; i < remainingVehicles && vehicleIndex < count; i++) {
      let location: { lat: number; lng: number };
      
      if (clusterCenters.length > 0) {
        const randomCenter = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        location = this.generateLocationNearCenter(randomCenter, 0.8); // 800m radius for remaining vehicles
      } else {
        // Fallback to random location if no cluster centers found
        location = randomLocation(bounds);
      }
      
      const capacity = 4 + Math.floor(Math.random() * 3);
      
      vehicles.push({
        id: uuidv4(),
        location,
        capacity,
        availableSeats: capacity,
        currentRoute: []
      });
      
      vehicleIndex++;
    }
    
    return vehicles;
  }
  
  /**
   * Generate passenger requests (internal method to avoid duplication)
   */
  private generatePassengerRequests(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): RideRequest[] {
    const requests: RideRequest[] = [];
    
    // Determine number of clusters based on passenger count
    // Create more clusters with 3-4 passengers each
    const passengersPerCluster = 3 + Math.floor(Math.random() * 2); // 3-4 passengers per cluster
    const numClusters = Math.floor(count * 0.8 / passengersPerCluster); // 80% of passengers in clusters
    const clusteredPassengers = numClusters * passengersPerCluster;
    const noisePassengers = count - clusteredPassengers;
    
    // Generate cluster centers
    const clusterCenters = this.generateClusterCenters(numClusters, bounds);
    
    // Generate passengers for each cluster
    for (let clusterIndex = 0; clusterIndex < numClusters; clusterIndex++) {
      const center = clusterCenters[clusterIndex];
      
      // Generate passengers around this cluster center
      for (let i = 0; i < passengersPerCluster; i++) {
        const pickupLocation = this.generateLocationNearCenter(center, 0.4); // 400m radius for more realistic spacing
        const dropoffLocation = this.generateLocationNearCenter(center, 1.2); // 1.2km radius for destination
        
        // Create timestamp within a smaller time window for clustering
        const timestamp = new Date();
        const timeOffset = Math.floor(Math.random() * 15) - 7; // ±7 minutes for more realistic temporal clustering
        timestamp.setMinutes(timestamp.getMinutes() + timeOffset);
        
        requests.push({
          id: uuidv4(),
          pickupLocation,
          dropoffLocation,
          timestamp
        });
      }
    }
    
    // Generate noise passengers (randomly distributed)
    for (let i = 0; i < noisePassengers; i++) {
      const pickupLocation = randomLocation(bounds);
      const dropoffLocation = randomLocation(bounds);
      
      // Create timestamp with more variation for noise passengers
      const timestamp = new Date();
      const timeOffset = Math.floor(Math.random() * 40) - 20; // ±20 minutes for noise
      timestamp.setMinutes(timestamp.getMinutes() + timeOffset);
      
      requests.push({
        id: uuidv4(),
        pickupLocation,
        dropoffLocation,
        timestamp
      });
    }
    
    return requests;
  }
  
  /**
   * Generate cluster centers within the given bounds
   */
  private generateClusterCenters(numClusters: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): { lat: number; lng: number }[] {
    const centers: { lat: number; lng: number }[] = [];
    
    for (let i = 0; i < numClusters; i++) {
      let center: { lat: number; lng: number };
      let attempts = 0;
      const maxAttempts = 50;
      
      do {
        center = randomLocation(bounds);
        attempts++;
      } while (
        attempts < maxAttempts && 
        centers.some(existingCenter => 
          this.calculateDistance(center, existingCenter) < 1.2 // Minimum 1.2km between clusters for more realistic spacing
        )
      );
      
      centers.push(center);
    }
    
    return centers;
  }
  
  /**
   * Generate a location near a center point within a specified radius
   */
  private generateLocationNearCenter(center: { lat: number; lng: number }, radiusKm: number): { lat: number; lng: number } {
    // Convert radius from km to degrees (approximate)
    const latRadius = radiusKm / 111; // 1 degree ≈ 111 km
    const lngRadius = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180));
    
    // Generate random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert to lat/lng offset
    const latOffset = (distance * Math.cos(angle)) / 111;
    const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(center.lat * Math.PI / 180));
    
    return {
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset
    };
  }
  
  /**
   * Extract actual cluster centers from passenger locations using a simple clustering approach
   * This ensures vehicles are positioned near actual passenger clusters, not theoretical ones
   */
  private extractActualClusterCenters(requests: RideRequest[], numCenters: number): { lat: number; lng: number }[] {
    if (requests.length === 0) {
      return [];
    }
    
    // Use pickup locations for clustering
    const pickupLocations = requests.map(req => req.pickupLocation);
    
    // Simple clustering approach to find actual cluster centers
    const centers: { lat: number; lng: number }[] = [];
    const usedPoints = new Set<number>();
    
    // Find points that are close to each other (potential cluster centers)
    for (let i = 0; i < pickupLocations.length && centers.length < numCenters; i++) {
      if (usedPoints.has(i)) continue;
      
      // Find nearby points
      const nearbyPoints: { lat: number; lng: number }[] = [pickupLocations[i]];
      usedPoints.add(i);
      
      for (let j = i + 1; j < pickupLocations.length; j++) {
        if (usedPoints.has(j)) continue;
        
        const distance = this.calculateDistance(pickupLocations[i], pickupLocations[j]);
        if (distance < 0.5) { // 500m threshold for clustering (increased for more realistic clusters)
          nearbyPoints.push(pickupLocations[j]);
          usedPoints.add(j);
        }
      }
      
      // If we have enough nearby points, create a cluster center
      if (nearbyPoints.length >= 2) {
        const center = calculateCentroid(nearbyPoints);
        centers.push(center);
        console.log(`Found cluster with ${nearbyPoints.length} passengers at center:`, center);
      }
    }
    
    // If we don't have enough cluster centers, add some random points
    // Add safety check to prevent infinite loop
    let attempts = 0;
    const maxAttempts = 100;
    
    while (centers.length < numCenters && centers.length < pickupLocations.length && attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * pickupLocations.length);
      const randomLocation = pickupLocations[randomIndex];
      
      // Check if this location is far enough from existing centers
      const isFarEnough = centers.every(center => 
        this.calculateDistance(randomLocation, center) > 0.8 // 800m minimum distance between centers
      );
      
      if (isFarEnough) {
        centers.push(randomLocation);
        console.log(`Added random cluster center:`, randomLocation);
      }
      
      attempts++;
    }
    
    // If we still don't have enough centers, just add random locations
    while (centers.length < numCenters && centers.length < pickupLocations.length) {
      const randomIndex = Math.floor(Math.random() * pickupLocations.length);
      centers.push(pickupLocations[randomIndex]);
    }
    
    return centers;
  }
  
  /**
   * Calculate distance between two points (simplified version)
   */
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const dLat = point2.lat - point1.lat;
    const dLng = point2.lng - point1.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }
} 