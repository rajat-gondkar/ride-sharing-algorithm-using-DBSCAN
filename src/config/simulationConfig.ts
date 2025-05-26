/**
 * Default configuration for the simulation
 */
export const DEFAULT_SIMULATION_CONFIG = {
  // Passenger count range
  MIN_PASSENGERS: 10,
  MAX_PASSENGERS: 50,
  DEFAULT_PASSENGERS: 20,
  
  // Vehicle count range
  MIN_VEHICLES: 3,
  MAX_VEHICLES: 10,
  DEFAULT_VEHICLES: 5,
  
  // Default time window in minutes
  DEFAULT_TIME_WINDOW: 15,
  
  // Default max detour distance in kilometers
  DEFAULT_MAX_DETOUR_KM: 2.0,
  
  // Map defaults (NYC-like coordinates)
  MAP_CENTER: [40.75, -73.95] as [number, number],
  DEFAULT_ZOOM: 13,
  
  // Visualization settings
  VEHICLE_ICON: '🚗',
  PASSENGER_ICON: '👤',
  CLUSTER_COLORS: [
    '#FF5733', // Red-Orange
    '#33FF57', // Green
    '#3357FF', // Blue
    '#FF33F5', // Pink
    '#F5FF33', // Yellow
    '#33FFF5', // Cyan
    '#F533FF', // Magenta
    '#FF8333', // Orange
    '#33FF83', // Sea Green
    '#8333FF'  // Purple
  ]
}; 