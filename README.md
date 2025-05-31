# Dynamic Ride-Sharing Simulator

An advanced simulation platform for urban ride-sharing, featuring:

- **DBSCAN clustering** for grouping ride requests by spatio-temporal proximity
- **Genetic algorithm-based matching** for optimal vehicle-to-passenger assignments
- Interactive map visualization with real-time simulation controls and performance metrics

## Features
- Simulate real-world ride-sharing scenarios with adjustable parameters (passengers, vehicles, detour limits, time windows)
- Visualize clusters, routes, vehicles, and requests on a live map
- Analyze efficiency with metrics like match percentage, average detour, and distance saved
- Modern, responsive UI built with React and Material-UI

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
```bash
# Clone the repository
https://github.com/jeffreymariaraj/ride-sharing.git
cd ride-sharing

# Install dependencies
npm install
```

### Running the App
```bash
npm start
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
ride-sharing/
├── src/
│   ├── components/
│   │   ├── ControlPanel.tsx
│   │   └── MapVisualization.tsx
│   ├── services/
│   │   ├── clustering/DBSCANClustering.ts
│   │   ├── matching/GeneticMatcher.ts
│   │   ├── routing/StraightLineRouter.ts
│   │   └── SimulationService.ts
│   ├── models/types.ts
│   ├── data/RandomDataGenerator.ts
│   ├── config/simulationConfig.ts
│   ├── utils/geo.ts
│   ├── App.tsx
│   ├── index.js (or index.tsx)
│   └── index.css
├── package.json
└── README.md
```

## Usage
- Adjust simulation parameters in the control panel
- Click "Run Simulation" to generate and optimize ride-sharing assignments
- View clusters, routes, and vehicles on the interactive map
- Analyze performance metrics after each simulation

## License
MIT 
