# Dynamic Ride-Sharing Simulator

A sophisticated React-based simulation platform that demonstrates advanced algorithms for optimizing urban ride-sharing services. This project combines **DBSCAN clustering** and **genetic algorithms** to create efficient vehicle-to-passenger matching systems that minimize travel distances and maximize ride-sharing opportunities.

## 🚀 Project Overview

The Dynamic Ride-Sharing Simulator addresses the complex challenge of matching multiple passengers with available vehicles in real-time, considering spatial proximity, time constraints, and vehicle capacity. The system simulates realistic urban scenarios where passengers request rides from various locations, and the algorithm determines optimal groupings and vehicle assignments.

### Key Features
- **Intelligent Clustering**: Groups nearby passengers using DBSCAN algorithm
- **Genetic Optimization**: Uses evolutionary algorithms for optimal vehicle matching
- **Real-time Visualization**: Interactive map showing clusters, routes, and vehicles
- **Performance Analytics**: Comprehensive metrics for efficiency analysis
- **Configurable Parameters**: Adjustable simulation settings for different scenarios
- **Realistic Data Generation**: Creates clustered passenger patterns with noise

## 🧠 Algorithm Details

### 1. DBSCAN Clustering Algorithm

**Purpose**: Groups passengers who are spatially and temporally close enough to share a ride.

**Implementation Details**:
- **Epsilon (ε)**: Distance threshold (default: 0.5 km) - maximum distance between cluster points
- **MinPts**: Minimum points required to form a cluster (default: 2 passengers)
- **Distance Metric**: Euclidean distance between passenger pickup locations
- **Noise Handling**: Isolated passengers outside clusters are handled separately

**Algorithm Flow**:
1. Randomly select unvisited points as potential cluster seeds
2. Expand clusters by finding all points within ε distance
3. Continue expansion recursively for each neighbor
4. Mark remaining unvisited points as noise

**Benefits**:
- Automatically determines optimal number of clusters
- Handles irregular cluster shapes
- Identifies outliers (noise passengers)
- Scales efficiently with large datasets

### 2. Genetic Algorithm for Vehicle Matching

**Purpose**: Optimizes vehicle-to-cluster assignments to minimize total travel distance and maximize efficiency.

**Implementation Details**:
- **Population Size**: 50 individuals per generation
- **Generations**: 100 iterations for convergence
- **Selection**: Tournament selection with size 3
- **Crossover**: Single-point crossover with 0.8 probability
- **Mutation**: Random gene mutation with 0.1 probability
- **Fitness Function**: Minimizes total distance while respecting constraints

### 3. Routing Algorithm

**Current Implementation**: Straight-line routing for simplicity
- Calculates direct distances between pickup and dropoff points
- Considers detour limits for passenger satisfaction
- Optimizes for total vehicle travel distance

**Future Enhancements**:
- Integration with real road network data
- Traffic-aware routing
- Time-based route optimization

## 🏗️ Architecture & Implementation

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) for modern, responsive design
- **Mapping**: Leaflet.js for interactive map visualization
- **State Management**: React hooks for local state
- **Styling**: CSS modules and MUI theming

## 📊 Performance Metrics

The simulator tracks several key performance indicators:

### 1. Matching Efficiency
- **Passenger Match Rate**: Percentage of passengers successfully matched to vehicles
- **Cluster Formation**: Number and size of passenger clusters created
- **Vehicle Utilization**: How efficiently vehicles are used

### 2. Distance Optimization
- **Total Distance Saved**: Reduction in travel distance through ride-sharing
- **Average Detour**: Additional distance passengers travel due to sharing
- **Vehicle Route Length**: Total distance each vehicle travels

### 3. Time Efficiency
- **Average Wait Time**: Time passengers wait for vehicle pickup
- **Service Time**: Total time from request to dropoff
- **Processing Time**: Algorithm execution time

## 🎮 Usage Guide

### Getting Started

#### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

#### Installation
```bash
# Clone the repository
git clone https://github.com/jeffreymariaraj/ride-sharing.git
cd ride-sharing

# Install dependencies
npm install
```

#### Running the Application
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Simulation Controls

#### Basic Parameters
- **Number of Passengers**: 10-100 (default: 30)
- **Number of Vehicles**: 5-50 (default: 10)
- **Maximum Detour**: 0.5-5.0 km (default: 2.0 km)
- **Time Window**: 15-60 minutes (default: 30 minutes)

#### Advanced Settings
- **DBSCAN Epsilon**: Clustering distance threshold (0.1-2.0 km)
- **DBSCAN MinPts**: Minimum cluster size (2-5 passengers)
- **Genetic Population**: Algorithm population size (20-100)
- **Genetic Generations**: Maximum iterations (50-200)

### Interpreting Results

#### Map Visualization
- **Blue Markers**: Individual passengers
- **Red Markers**: Available vehicles
- **Colored Polygons**: Passenger clusters
- **Colored Lines**: Vehicle routes
- **Green Lines**: Matched passengers

#### Metrics Panel
- **Match Percentage**: Success rate of passenger-vehicle matching
- **Average Detour**: Additional distance per passenger
- **Total Distance Saved**: Efficiency improvement through sharing
- **Processing Time**: Algorithm performance

## 🔧 Configuration

### Algorithm Parameters

#### DBSCAN Configuration
```typescript
const dbscanConfig = {
  epsilon: 0.5,        // Distance threshold in km
  minPoints: 2,        // Minimum cluster size
  maxClusterSize: 4    // Maximum passengers per cluster
};
```

#### Genetic Algorithm Configuration
```typescript
const geneticConfig = {
  populationSize: 50,
  generations: 100,
  tournamentSize: 3,
  crossoverRate: 0.8,
  mutationRate: 0.1
};
```

### Customization Options

#### Adding New Algorithms
1. Implement algorithm interface in `services/` directory
2. Add configuration options to `simulationConfig.ts`
3. Integrate with `SimulationService.ts`

#### Extending Data Models
1. Update TypeScript interfaces in `models/types.ts`
2. Modify data generation in `RandomDataGenerator.ts`
3. Update visualization components

## 🚀 Future Enhancements

### Planned Features
- **Real-time Traffic Integration**: Live traffic data for route optimization
- **Multi-modal Transportation**: Integration with public transit
- **Dynamic Pricing**: Surge pricing based on demand
- **Predictive Analytics**: Machine learning for demand forecasting
- **Mobile Application**: React Native companion app

## 🙏 Acknowledgments

- **DBSCAN Algorithm**: Original paper by Ester et al. (1996)
- **Genetic Algorithms**: Inspired by Holland's work on evolutionary computation
- **React Community**: For excellent documentation and ecosystem
- **Material-UI**: For beautiful, accessible UI components
- **Leaflet.js**: For powerful mapping capabilities
