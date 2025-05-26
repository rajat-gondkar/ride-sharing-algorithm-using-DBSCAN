import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Box, Typography, Paper, useMediaQuery, alpha } from '@mui/material';
import MapVisualization from './components/MapVisualization';
import ControlPanel from './components/ControlPanel';
import { RideRequest, Vehicle, Cluster, Assignment, SimulationParams } from './models/types';
import { RandomDataGenerator } from './data/RandomDataGenerator';
import { DBSCANClustering } from './services/clustering/DBSCANClustering';
import { GeneticMatcher } from './services/matching/GeneticMatcher';
import { StraightLineRouter } from './services/routing/StraightLineRouter';
import { SimulationService } from './services/SimulationService';
import './App.css';

// Create services
const dataAdapter = new RandomDataGenerator();

// Advanced algorithms (upgraded version)
const dbscanClustering = new DBSCANClustering();
const geneticMatcher = new GeneticMatcher();

// Legacy algorithms are disabled to use only advanced algorithms
// KMeansClustering and GreedyMatcher are no longer used

// Routing engine
const routingEngine = new StraightLineRouter();

// Create simulation service with the advanced algorithms
const simulationService = new SimulationService(
  dataAdapter,
  dbscanClustering,  // Using the improved DBSCAN clustering
  geneticMatcher,    // Using the improved Genetic Algorithm matcher
  routingEngine
);

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5', // Indigo
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057', // Pink
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#fff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          padding: '8px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8,
        },
        thumb: {
          height: 20,
          width: 20,
        },
        track: {
          height: 8,
          borderRadius: 4,
        },
        rail: {
          height: 8,
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  // State for simulation data
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [metrics, setMetrics] = useState<{
    percentageMatched: number;
    averageDetourDistance: number;
    totalDistanceSaved: number;
  } | null>(null);
  
  // UI state
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Run the simulation
  const handleRunSimulation = async (params: SimulationParams) => {
    try {
      setSimulationRunning(true);
      
      // Run the simulation
      const result = await simulationService.runSimulation(params);
      
      // Update state with results
      setRequests(result.requests);
      setVehicles(result.vehicles);
      setClusters(result.clusters);
      setAssignments(result.assignments);
      
      // Calculate metrics
      const simulationMetrics = simulationService.calculateMetrics(
        result.requests,
        result.assignments
      );
      setMetrics(simulationMetrics);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setSimulationRunning(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          pt: 3,
          pb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #3f51b5 30%, #f50057 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Dynamic Ride-Sharing Simulator
            </Typography>
            <Typography
              variant="h6"
              color="textSecondary"
              gutterBottom
              sx={{ maxWidth: '700px', mx: 'auto', mb: 3 }}
            >
              An advanced simulation platform using DBSCAN clustering and genetic algorithms to optimize urban mobility
            </Typography>
          </Box>
          
          <ControlPanel 
            onRunSimulation={handleRunSimulation}
            simulationRunning={simulationRunning}
            showClusters={showClusters}
            showRoutes={showRoutes}
            onToggleClusters={() => setShowClusters(!showClusters)}
            onToggleRoutes={() => setShowRoutes(!showRoutes)}
            metrics={metrics}
          />
          
          <Paper 
            elevation={3} 
            sx={{ 
              overflow: 'hidden', 
              borderRadius: 4,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                transform: 'translateY(-4px)',
              }
            }}
          >
            <MapVisualization 
              requests={requests}
              vehicles={vehicles}
              clusters={clusters}
              assignments={assignments}
              showClusters={showClusters}
              showRoutes={showRoutes}
            />
          </Paper>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              © {new Date().getFullYear()} Dynamic Ride-Sharing Algorithm Simulator — Built with React & Material-UI
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
