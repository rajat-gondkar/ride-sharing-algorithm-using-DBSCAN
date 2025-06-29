import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Slider, 
  Button, 
  FormControlLabel, 
  Switch,
  Divider,
  Stack,
  Badge,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { SimulationParams } from '../models/types';
import { DEFAULT_SIMULATION_CONFIG } from '../config/simulationConfig';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import RouteIcon from '@mui/icons-material/Route';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface ControlPanelProps {
  onRunSimulation: (params: SimulationParams) => void;
  simulationRunning: boolean;
  showClusters: boolean;
  showRoutes: boolean;
  onToggleClusters: () => void;
  onToggleRoutes: () => void;
  metrics: {
    percentageMatched: number;
    averageDetourDistance: number;
    totalDistanceSaved: number;
  } | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onRunSimulation,
  simulationRunning,
  showClusters,
  showRoutes,
  onToggleClusters,
  onToggleRoutes,
  metrics
}) => {
  const theme = useTheme();
  // State for all the sliders
  const [passengerCount, setPassengerCount] = React.useState(DEFAULT_SIMULATION_CONFIG.DEFAULT_PASSENGERS);
  const [vehicleCount, setVehicleCount] = React.useState(DEFAULT_SIMULATION_CONFIG.DEFAULT_VEHICLES);
  const [maxDetourDistance, setMaxDetourDistance] = React.useState(DEFAULT_SIMULATION_CONFIG.DEFAULT_MAX_DETOUR_KM);
  const [timeWindow, setTimeWindow] = React.useState(DEFAULT_SIMULATION_CONFIG.DEFAULT_TIME_WINDOW);

  // Handler for running the simulation
  const handleRunSimulation = () => {
    onRunSimulation({
      passengerCount,
      vehicleCount,
      maxDetourDistance,
      timeWindow
    });
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3, 
        borderRadius: 3, 
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'visible',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: -20, 
          left: 35, 
          background: theme.palette.primary.main,
          color: '#fff',
          borderRadius: '50px',
          px: 3,
          py: 1,
          boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
          Simulation Controls
        </Typography>
      </Box>
      
      <CardContent sx={{ pt: 4, pb: 3 }}>        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: { xs: 1, md: 1 } }}>
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleAltIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Passenger Count: <Badge 
                  color="primary" 
                  badgeContent={passengerCount} 
                  sx={{ ml: 1 }}
                  max={999}
                />
              </Typography>
              <Slider
                value={passengerCount}
                onChange={(_, value) => setPassengerCount(value as number)}
                min={DEFAULT_SIMULATION_CONFIG.MIN_PASSENGERS}
                max={DEFAULT_SIMULATION_CONFIG.MAX_PASSENGERS}
                valueLabelDisplay="auto"
                disabled={simulationRunning}
                sx={{ 
                  color: theme.palette.primary.main,
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.primary.main, 0.16)}`
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCarIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                Vehicle Count: <Badge 
                  color="secondary" 
                  badgeContent={vehicleCount} 
                  sx={{ ml: 1 }}
                  max={999}
                />
              </Typography>
              <Slider
                value={vehicleCount}
                onChange={(_, value) => setVehicleCount(value as number)}
                min={DEFAULT_SIMULATION_CONFIG.MIN_VEHICLES}
                max={DEFAULT_SIMULATION_CONFIG.MAX_VEHICLES}
                valueLabelDisplay="auto"
                disabled={simulationRunning}
                sx={{ 
                  color: theme.palette.secondary.main,
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.secondary.main, 0.16)}`
                    }
                  }
                }}
              />
            </Box>
            </Box>
          
            <Box sx={{ flex: { xs: 1, md: 1 } }}>
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <RouteIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                Max Detour Distance (km): <Badge 
                  color="success" 
                  badgeContent={maxDetourDistance.toFixed(1)} 
                  sx={{ ml: 1 }}
                  max={999}
                />
              </Typography>
              <Slider
                value={maxDetourDistance}
                onChange={(_, value) => setMaxDetourDistance(value as number)}
                min={0.5}
                max={5.0}
                step={0.1}
                valueLabelDisplay="auto"
                disabled={simulationRunning}
                sx={{ 
                  color: theme.palette.success.main,
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.success.main, 0.16)}`
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                Time Window (minutes): <Badge 
                  color="info" 
                  badgeContent={timeWindow} 
                  sx={{ ml: 1 }}
                  max={999}
                />
              </Typography>
              <Slider
                value={timeWindow}
                onChange={(_, value) => setTimeWindow(value as number)}
                min={5}
                max={30}
                step={1}
                valueLabelDisplay="auto"
                disabled={simulationRunning}
                sx={{ 
                  color: theme.palette.info.main,
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.info.main, 0.16)}`
                    }
                  }
                }}
              />
            </Box>
            </Box>
          </Box>

          <Box>
            <Divider sx={{ my: 2 }} />
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
            >
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showClusters}
                      onChange={onToggleClusters}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GroupWorkIcon sx={{ mr: 0.5 }} /> Show Clusters
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showRoutes}
                      onChange={onToggleRoutes}
                      color="secondary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <RouteIcon sx={{ mr: 0.5 }} /> Show Routes
                    </Box>
                  }
                />
              </Stack>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleRunSimulation}
                disabled={simulationRunning}
                sx={{ 
                  minWidth: 180,
                  py: 1,
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(63, 81, 181, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
                startIcon={simulationRunning ? <SpeedIcon /> : <PlayArrowIcon />}
              >
                {simulationRunning ? 'Running...' : 'Run Simulation'}
              </Button>
            </Stack>
          </Box>
          
          {metrics && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Simulation Results
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: { xs: 1, md: 1 } }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUpIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                          {metrics.percentageMatched.toFixed(1)}%
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Passengers Matched
                      </Typography>
                    </Paper>
                  </Box>
                  
                  <Box sx={{ flex: { xs: 1, md: 1 } }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingDownIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                        <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}>
                          {metrics.averageDetourDistance.toFixed(2)} km
                      </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Avg Detour Distance
                      </Typography>
                    </Paper>
                  </Box>
                  
                  <Box sx={{ flex: { xs: 1, md: 1 } }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                        <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                          {metrics.totalDistanceSaved.toFixed(2)} km
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Total Distance Saved
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ControlPanel; 