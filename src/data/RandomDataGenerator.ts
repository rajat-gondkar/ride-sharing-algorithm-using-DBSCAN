import { IDataAdapter } from '../services/interfaces';
import { RideRequest, Vehicle } from '../models/types';
import { randomLocation } from '../utils/geo';
import { v4 as uuidv4 } from 'uuid';

/**
 * Random data generator for the MVP implementation
 * This will be replaced with real data sources in future versions
 */
export class RandomDataGenerator implements IDataAdapter {
  
  /**
   * Generate a specified number of random ride requests within given bounds
   */
  generateRequests(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): RideRequest[] {
    const requests: RideRequest[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a random pickup and dropoff location
      const pickupLocation = randomLocation(bounds);
      const dropoffLocation = randomLocation(bounds);
      
      // Create a timestamp within the last hour
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 60));
      
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
   * Generate a specified number of random vehicles within given bounds
   */
  generateVehicles(count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Vehicle[] {
    const vehicles: Vehicle[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a random vehicle location
      const location = randomLocation(bounds);
      
      // Each vehicle has a capacity between 4-6 passengers
      const capacity = 4 + Math.floor(Math.random() * 3);
      
      vehicles.push({
        id: uuidv4(),
        location,
        capacity,
        availableSeats: capacity,
        currentRoute: []
      });
    }
    
    return vehicles;
  }
} 