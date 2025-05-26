import { Coordinates } from '../models/types';

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the Haversine distance between two points on Earth.
 * @param coord1 First coordinates
 * @param coord2 Second coordinates
 * @returns Distance in kilometers
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generates a random location within the given bounds
 */
export function randomLocation(bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Coordinates {
  return {
    lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
    lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng)
  };
}

/**
 * Calculates the center point of multiple coordinates
 */
export function calculateCentroid(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate centroid of empty coordinates array');
  }
  
  const sum = coordinates.reduce(
    (acc, coord) => {
      return { lat: acc.lat + coord.lat, lng: acc.lng + coord.lng };
    },
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length
  };
} 