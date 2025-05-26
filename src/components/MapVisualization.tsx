import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { DivIcon, Icon } from 'leaflet';
import { Cluster, RideRequest, Vehicle, Assignment } from '../models/types';
import { DEFAULT_SIMULATION_CONFIG } from '../config/simulationConfig';
import { toLatLng } from '../models/types';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, useTheme, Paper, Chip, alpha } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PlaceIcon from '@mui/icons-material/Place';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import RouteIcon from '@mui/icons-material/Route';

interface MapVisualizationProps {
  requests: RideRequest[];
  vehicles: Vehicle[];
  clusters: Cluster[];
  assignments: Assignment[];
  showClusters: boolean;
  showRoutes: boolean;
}

// Component that automatically centers and zooms the map after data changes
function MapController({ requests, vehicles }: { requests: RideRequest[], vehicles: Vehicle[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (requests.length > 0 || vehicles.length > 0) {
      // Create bounds that include all vehicles and requests
      const allPoints = [
        ...vehicles.map(v => toLatLng(v.location)),
        ...requests.map(r => toLatLng(r.pickupLocation)),
        ...requests.map(r => toLatLng(r.dropoffLocation))
      ];
      
      if (allPoints.length > 0) {
        // Fit map to include all points with some padding
        map.fitBounds(allPoints, { padding: [50, 50] });
      }
    }
  }, [map, requests, vehicles]);
  
  return null;
}

// Custom animated marker component for vehicles with pulsing effect
function VehicleMarker({ vehicle, color }: { vehicle: Vehicle, color: string }) {
  const theme = useTheme();
  
  const vehicleIcon = new DivIcon({
    html: `
      <div style="
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${alpha(color, 0.2)};
          animation: pulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 22px;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
        ">
          ${DEFAULT_SIMULATION_CONFIG.VEHICLE_ICON}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }
      </style>
    `,
    className: 'vehicle-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  return (
    <Marker 
      key={vehicle.id} 
      position={toLatLng(vehicle.location)}
      icon={vehicleIcon}
    >
      <Popup>
        <Box sx={{ width: 220, padding: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <DirectionsCarIcon sx={{ color, mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Vehicle {vehicle.id.substring(0, 6)}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: vehicle.availableSeats > 0 ? 'green' : 'red',
              mr: 1 
            }}></Box>
            Status: {vehicle.availableSeats > 0 ? 'Available' : 'Full'}
          </Typography>
          
          <Chip 
            size="small" 
            label={`Capacity: ${vehicle.capacity}`} 
            sx={{ mr: 1, mt: 1, backgroundColor: alpha(color, 0.1), color: 'text.primary' }} 
          />
          <Chip 
            size="small" 
            label={`Available: ${vehicle.availableSeats}`} 
            sx={{ mt: 1, backgroundColor: alpha(color, 0.1), color: 'text.primary' }} 
          />
        </Box>
      </Popup>
    </Marker>
  );
}

// Enhanced passenger marker
function PassengerMarker({ request, assignment, color }: { request: RideRequest, assignment: Assignment | undefined, color: string }) {
  const passengerIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  return (
    <Marker 
      position={toLatLng(request.pickupLocation)}
      icon={passengerIcon}
    >
      <Popup>
        <Box sx={{ width: 220, padding: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonPinCircleIcon sx={{ color: assignment ? color : 'gray', mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Passenger {request.id.substring(0, 6)}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: assignment ? 'green' : 'orange',
              mr: 1 
            }}></Box>
            Status: {assignment ? 'Assigned' : 'Waiting'}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
            Pickup time: {request.timestamp.toLocaleTimeString()}
          </Typography>
          
          {assignment && (
            <Chip 
              size="small" 
              icon={<DirectionsCarIcon />}
              label={`Vehicle: ${assignment.vehicleId.substring(0, 6)}`} 
              sx={{ mt: 1, backgroundColor: alpha(color, 0.1), color: 'text.primary' }} 
            />
          )}
        </Box>
      </Popup>
    </Marker>
  );
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  requests,
  vehicles,
  clusters,
  assignments,
  showClusters,
  showRoutes
}) => {
  const theme = useTheme();
  
  // Create a mapping of vehicle IDs to colors for consistent coloring
  const vehicleColors = React.useMemo(() => {
    const colorMap = new Map<string, string>();
    vehicles.forEach((vehicle, index) => {
      const colorIndex = index % DEFAULT_SIMULATION_CONFIG.CLUSTER_COLORS.length;
      colorMap.set(vehicle.id, DEFAULT_SIMULATION_CONFIG.CLUSTER_COLORS[colorIndex]);
    });
    return colorMap;
  }, [vehicles]);

  // Create a mapping of cluster IDs to colors for consistent coloring
  const clusterColors = React.useMemo(() => {
    const colorMap = new Map<string, string>();
    clusters.forEach((cluster, index) => {
      const colorIndex = index % DEFAULT_SIMULATION_CONFIG.CLUSTER_COLORS.length;
      colorMap.set(cluster.id, DEFAULT_SIMULATION_CONFIG.CLUSTER_COLORS[colorIndex]);
    });
    return colorMap;
  }, [clusters]);

  // Create a mapping of request IDs to assignments for lookup
  const requestAssignments = React.useMemo(() => {
    const assignmentMap = new Map<string, Assignment>();
    assignments.forEach(assignment => {
      assignment.requestIds.forEach(requestId => {
        assignmentMap.set(requestId, assignment);
      });
    });
    return assignmentMap;
  }, [assignments]);

  return (
    <Box sx={{ position: 'relative' }}>
      <MapContainer
        center={DEFAULT_SIMULATION_CONFIG.MAP_CENTER}
        zoom={DEFAULT_SIMULATION_CONFIG.DEFAULT_ZOOM}
        style={{ height: '600px', width: '100%', borderRadius: '16px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController requests={requests} vehicles={vehicles} />

        {/* Render clusters if enabled */}
        {showClusters && clusters.map(cluster => {
          const color = clusterColors.get(cluster.id) || '#FF5733';
          
          return (
            <React.Fragment key={cluster.id}>
              <Circle
                center={toLatLng(cluster.centroid)}
                radius={300} // 300 meters
                pathOptions={{ 
                  color,
                  fillOpacity: 0.2,
                  weight: 1,
                }}
              >
                <Popup>
                  <Box sx={{ width: 220, padding: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <GroupWorkIcon sx={{ color, mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Cluster {cluster.id.substring(0, 6)}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      size="small" 
                      label={`Requests: ${cluster.requests.length}`}
                      sx={{ backgroundColor: alpha(color, 0.1), color: 'text.primary' }} 
                    />
                  </Box>
                </Popup>
              </Circle>
            </React.Fragment>
          );
        })}

        {/* Render vehicles */}
        {vehicles.map(vehicle => {
          const color = vehicleColors.get(vehicle.id) || '#333333';
          return <VehicleMarker key={vehicle.id} vehicle={vehicle} color={color} />;
        })}

        {/* Render passengers (ride requests) */}
        {requests.map(request => {
          const assignment = requestAssignments.get(request.id);
          const color = assignment 
            ? vehicleColors.get(assignment.vehicleId) || '#333333'
            : '#333333'; // Gray for unassigned
          
          return (
            <React.Fragment key={request.id}>
              {/* Pickup marker */}
              <PassengerMarker request={request} assignment={assignment} color={color} />

              {/* Dropoff marker */}
              <Circle
                center={toLatLng(request.dropoffLocation)}
                radius={50}
                pathOptions={{ 
                  color, 
                  fillOpacity: 0.7,
                  weight: 1
                }}
              >
                <Popup>
                  <Box sx={{ width: 220, padding: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ color, mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Dropoff {request.id.substring(0, 6)}
                      </Typography>
                    </Box>
                  </Box>
                </Popup>
              </Circle>
            </React.Fragment>
          );
        })}

        {/* Render routes if enabled */}
        {showRoutes && assignments.map(assignment => {
          const color = vehicleColors.get(assignment.vehicleId) || '#333333';
          
          return (
            <Polyline
              key={assignment.vehicleId}
              positions={assignment.route.map(toLatLng)}
              pathOptions={{ 
                color, 
                weight: 4, 
                opacity: 0.7,
                dashArray: '10, 10',
                lineCap: 'round'
              }}
            >
              <Popup>
                <Box sx={{ width: 220, padding: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RouteIcon sx={{ color, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Route for Vehicle {assignment.vehicleId.substring(0, 6)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Total stops: {assignment.route.length}
                  </Typography>
                  
                  <Chip 
                    size="small" 
                    label={`Passengers: ${assignment.requestIds.length}`}
                    sx={{ backgroundColor: alpha(color, 0.1), color: 'text.primary' }} 
                  />
                </Box>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>
      
      {/* Map overlay with legend */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: 2,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          maxWidth: 170,
          zIndex: 1000,
        }}
      >
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Map Legend
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DirectionsCarIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.primary.main }} />
          <Typography variant="body2">Vehicles</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PersonPinCircleIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.info.main }} />
          <Typography variant="body2">Pickup Points</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PlaceIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.secondary.main }} />
          <Typography variant="body2">Dropoff Points</Typography>
        </Box>
        
        {showClusters && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <GroupWorkIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.success.main }} />
            <Typography variant="body2">Request Clusters</Typography>
          </Box>
        )}
        
        {showRoutes && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RouteIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.warning.main }} />
            <Typography variant="body2">Vehicle Routes</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapVisualization; 