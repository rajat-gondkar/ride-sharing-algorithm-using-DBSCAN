# Dynamic Ride-Sharing Algorithm Simulator for Smart Cities

This project is an educational simulator demonstrating how algorithmic matching can reduce traffic congestion and carbon emissions in urban environments by optimizing ride-sharing.

## Problem Statement

Urban traffic congestion and carbon emissions are exacerbated by inefficient single-passenger rides. Existing ride-sharing solutions often lack real-time adaptability to demand spikes and traffic conditions.

## Solution

This simulator implements a dynamic algorithm that:
1. Clusters ride requests spatially and temporally
2. Optimizes vehicle routes using hybrid heuristics
3. Demonstrates scalability through an interactive visualization tool

## Advanced Algorithms

### ✅ Implemented
1. **Temporal-Spatial DBSCAN Clustering**
   - Density-based clustering that forms natural groups of nearby ride requests
   - Considers both spatial proximity and temporal matching
   - Automatically identifies outliers (solo rides) and variable-shaped clusters
   - Adapts to varying density without requiring predetermined cluster count

2. **Genetic Algorithm for Route Optimization**
   - Evolution-inspired approach that discovers optimal vehicle assignments
   - Uses fitness functions balancing passenger matching and minimizing detours
   - Considers global optimization rather than greedy local decisions
   - Continuously improves solutions through selection, crossover, and mutation

### 🔜 Future Enhancements
- Route optimization using Google Maps API
- Traveling Salesman Problem (TSP) solver for pickup/dropoff sequence
- Passenger preference modeling

## Features

- **Interactive Map Visualization**: Shows vehicles (🚗) and passengers (👤) on an interactive map
- **Adjustable Parameters**: Control passenger count, vehicle count, detour distances, and time windows
- **Real-time Metrics**: View percentage of passengers matched, average detour distance, and total distance saved
- **Modular Architecture**: Designed for future expandability with interfaces for different clustering, matching, and routing strategies

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ridesharing-simulator.git
cd ridesharing-simulator
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## How to Use

1. Adjust the simulation parameters using the sliders:
   - Passenger Count: number of ride requests to generate
   - Vehicle Count: number of vehicles available
   - Max Detour Distance: maximum allowed detour in kilometers
   - Time Window: time span for grouping requests (in minutes)

2. Click the "Simulate" button to run the simulation

3. View the results on the map and in the metrics panel

4. Toggle "Show Clusters" and "Show Routes" to customize the visualization

## Technical Implementation

### DBSCAN Clustering

```typescript
// Calculate combined spatio-temporal distance between requests
private calculateSpatioTemporalDistance(request1, request2, timeWindow): number {
  // Calculate spatial distance (km)
  const spatialDistance = haversineDistance(
    request1.pickupLocation,
    request2.pickupLocation
  );
  
  // Calculate temporal distance (minutes)
  const temporalDistance = Math.abs(
    (request1.timestamp.getTime() - request2.timestamp.getTime()) / (1000 * 60)
  );
  
  // Weighted combination (70% spatial, 30% temporal)
  const combinedDistance = 
    0.7 * normalizedSpatialDistance + 
    0.3 * normalizedTemporalDistance;
  
  return combinedDistance * MAX_SPATIAL_DISTANCE;
}
```

### Genetic Algorithm

```typescript
// Calculate fitness of a solution (higher is better)
private calculateFitness(solution, clusters, vehicles, constraints): number {
  // ...calculate assignment metrics
  
  const assignmentRatio = totalAssigned / maxPossibleAssigned;
  const normalizedDetour = Math.min(totalDetour / totalAssigned / maxDetour, 1);
  
  // Fitness function weights
  const w1 = 0.7; // Assignment ratio weight
  const w2 = 0.3; // Detour minimization weight
  
  return w1 * assignmentRatio - w2 * normalizedDetour;
}
```

## Project Structure

- `src/models`: Core data types and interfaces
- `src/services`: Implementation of the different strategies:
  - `clustering`: DBSCAN and k-means implementations
  - `matching`: Genetic algorithm and greedy matcher implementations
  - `routing`: Straight-line routing (future: real routing APIs)
- `src/components`: React components for the UI
- `src/utils`: Utility functions for calculations
- `src/data`: Data generation for the simulation
- `src/config`: Configuration parameters

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/) - UI library
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [Material-UI](https://mui.com/) - Component library
