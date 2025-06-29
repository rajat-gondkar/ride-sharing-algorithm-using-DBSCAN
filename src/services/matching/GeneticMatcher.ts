import { IMatchingStrategy } from '../interfaces';
import { Cluster, Vehicle, Assignment, Coordinates, RideRequest } from '../../models/types';
import { haversineDistance } from '../../utils/geo';

/**
 * Genetic Algorithm for optimized ride-sharing matching
 * Improves over the greedy matcher by:
 * - Finding global optimization rather than local
 * - Considering multiple routes and combinations
 * - Producing more efficient vehicle-to-cluster assignments
 * - Minimizing total system-wide detour distance
 */
export class GeneticMatcher implements IMatchingStrategy {
  // Genetic algorithm parameters
  private readonly POPULATION_SIZE = 50;
  private readonly MAX_GENERATIONS = 100;
  private readonly MUTATION_RATE = 0.2;
  private readonly ELITISM_RATE = 0.2;
  private readonly CROSSOVER_RATE = 0.7;

  match(clusters: Cluster[], vehicles: Vehicle[], constraints: { maxDetourKm: number }): Assignment[] {
    if (clusters.length === 0 || vehicles.length === 0) {
      return [];
    }

    // Create initial population
    let population = this.initializePopulation(clusters, vehicles, constraints);
    
    // Track best solution
    let bestSolution = this.findBestSolution(population, clusters, vehicles, constraints);
    let bestFitness = this.calculateFitness(bestSolution, clusters, vehicles, constraints);
    let generationsWithoutImprovement = 0;
    
    // Run for specified generations or until convergence
    for (let generation = 0; generation < this.MAX_GENERATIONS; generation++) {
      // Create next generation
      population = this.evolvePopulation(population, clusters, vehicles, constraints);
      
      // Check for improvement
      const currentBest = this.findBestSolution(population, clusters, vehicles, constraints);
      const currentFitness = this.calculateFitness(currentBest, clusters, vehicles, constraints);
      
      // Update best solution if improved
      if (currentFitness > bestFitness) {
        bestSolution = currentBest;
        bestFitness = currentFitness;
        generationsWithoutImprovement = 0;
      } else {
        generationsWithoutImprovement++;
      }
      
      // Early termination if no improvement for 20 generations
      if (generationsWithoutImprovement >= 20) {
        break;
      }
    }
    
    // Post-process: Assign idle vehicles to unassigned clusters
    const improvedSolution = this.postProcessSolution(bestSolution, clusters, vehicles, constraints);
    
    // Convert the improved solution to assignments
    return this.solutionToAssignments(improvedSolution, clusters, vehicles);
  }
  
  /**
   * Initialize a population of potential solutions
   */
  private initializePopulation(
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): number[][] {
    const population: number[][] = [];
    
    // Create random solutions
    for (let i = 0; i < this.POPULATION_SIZE; i++) {
      // Each solution is an array where index = cluster index, value = vehicle index
      // -1 means unassigned cluster
      const solution = new Array(clusters.length).fill(-1);
      
      // Clone vehicles to track capacity
      const availableVehicles = vehicles.map(v => ({
        ...v,
        availableSeats: v.availableSeats
      }));
      
      // For some solutions, prioritize greedy assignment to maximize matching
      const useGreedyAssignment = i < this.POPULATION_SIZE * 0.3; // 30% greedy solutions
      
      if (useGreedyAssignment) {
        // Greedy assignment: assign clusters to nearest available vehicle
        for (let j = 0; j < clusters.length; j++) {
          const clusterSize = clusters[j].requests.length;
          
          // Find vehicles with enough capacity
          const eligibleVehicles = availableVehicles
            .map((vehicle, index) => ({ vehicle, index }))
            .filter(({ vehicle }) => vehicle.availableSeats >= clusterSize);
          
          if (eligibleVehicles.length > 0) {
            // Find the nearest eligible vehicle
            let bestVehicleIndex = -1;
            let bestDistance = Infinity;
            
            for (const { vehicle, index } of eligibleVehicles) {
              const distance = haversineDistance(
                vehicle.location,
                clusters[j].centroid
              );
              
              if (distance <= constraints.maxDetourKm && distance < bestDistance) {
                bestVehicleIndex = index;
                bestDistance = distance;
              }
            }
            
            // Assign to best vehicle if found
            if (bestVehicleIndex !== -1) {
              solution[j] = bestVehicleIndex;
              availableVehicles[bestVehicleIndex].availableSeats -= clusterSize;
            }
          }
        }
      } else {
        // Random assignment (original logic)
        for (let j = 0; j < clusters.length; j++) {
          const clusterSize = clusters[j].requests.length;
          
          // Find vehicles with enough capacity
          const eligibleVehicles = availableVehicles
            .map((vehicle, index) => ({ vehicle, index }))
            .filter(({ vehicle }) => vehicle.availableSeats >= clusterSize);
          
          if (eligibleVehicles.length > 0) {
            // Randomly select a vehicle
            const randomIndex = Math.floor(Math.random() * eligibleVehicles.length);
            const selectedVehicle = eligibleVehicles[randomIndex];
            
            // Check distance constraint
            const distance = haversineDistance(
              selectedVehicle.vehicle.location,
              clusters[j].centroid
            );
            
            if (distance <= constraints.maxDetourKm) {
              // Assign cluster to vehicle
              solution[j] = selectedVehicle.index;
              // Update vehicle capacity
              availableVehicles[selectedVehicle.index].availableSeats -= clusterSize;
            }
          }
        }
      }
      
      population.push(solution);
    }
    
    return population;
  }
  
  /**
   * Evolve the population through selection, crossover, and mutation
   */
  private evolvePopulation(
    population: number[][], 
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): number[][] {
    const newPopulation: number[][] = [];
    
    // Elitism: keep best solutions
    const eliteCount = Math.floor(this.POPULATION_SIZE * this.ELITISM_RATE);
    const sortedPopulation = [...population]
      .sort((a, b) => 
        this.calculateFitness(b, clusters, vehicles, constraints) - 
        this.calculateFitness(a, clusters, vehicles, constraints)
      );
    
    // Add elite solutions to new population
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push([...sortedPopulation[i]]);
    }
    
    // Fill the rest with offspring
    while (newPopulation.length < this.POPULATION_SIZE) {
      // Select parents using tournament selection
      const parent1 = this.tournamentSelection(population, clusters, vehicles, constraints);
      const parent2 = this.tournamentSelection(population, clusters, vehicles, constraints);
      
      let offspring1 = [...parent1];
      let offspring2 = [...parent2];
      
      // Crossover
      if (Math.random() < this.CROSSOVER_RATE) {
        [offspring1, offspring2] = this.crossover(offspring1, offspring2);
      }
      
      // Mutation
      this.mutate(offspring1, clusters, vehicles, constraints);
      this.mutate(offspring2, clusters, vehicles, constraints);
      
      // Repair solutions if needed to ensure constraint satisfaction
      this.repairSolution(offspring1, clusters, vehicles, constraints);
      this.repairSolution(offspring2, clusters, vehicles, constraints);
      
      // Add to new population
      newPopulation.push(offspring1);
      if (newPopulation.length < this.POPULATION_SIZE) {
        newPopulation.push(offspring2);
      }
    }
    
    return newPopulation;
  }
  
  /**
   * Tournament selection to pick parents
   */
  private tournamentSelection(
    population: number[][], 
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): number[] {
    // Tournament size (typically 2-5)
    const tournamentSize = 3;
    const tournament: number[][] = [];
    
    // Randomly select candidates
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    
    // Find best candidate
    let bestCandidate = tournament[0];
    let bestFitness = this.calculateFitness(bestCandidate, clusters, vehicles, constraints);
    
    for (let i = 1; i < tournamentSize; i++) {
      const fitness = this.calculateFitness(tournament[i], clusters, vehicles, constraints);
      if (fitness > bestFitness) {
        bestCandidate = tournament[i];
        bestFitness = fitness;
      }
    }
    
    return [...bestCandidate];
  }
  
  /**
   * Crossover two parent solutions to create offspring
   */
  private crossover(parent1: number[], parent2: number[]): [number[], number[]] {
    // Single-point crossover
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    
    const offspring1 = [
      ...parent1.slice(0, crossoverPoint),
      ...parent2.slice(crossoverPoint)
    ];
    
    const offspring2 = [
      ...parent2.slice(0, crossoverPoint),
      ...parent1.slice(crossoverPoint)
    ];
    
    return [offspring1, offspring2];
  }
  
  /**
   * Mutate a solution by randomly changing some assignments
   */
  private mutate(
    solution: number[], 
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): void {
    for (let i = 0; i < solution.length; i++) {
      if (Math.random() < this.MUTATION_RATE) {
        // Either assign to a different vehicle or unassign
        const currentVehicle = solution[i];
        const clusterSize = clusters[i].requests.length;
        
        // Find eligible vehicles
        const eligibleVehicles = vehicles
          .map((vehicle, index) => ({ vehicle, index }))
          .filter(({ vehicle, index }) => {
            // Calculate available capacity excluding current assignment
            let availableCapacity = vehicle.availableSeats;
            if (index === currentVehicle) {
              availableCapacity += clusterSize;
            }
            
            // Check capacity and distance
            const meetsCapacity = availableCapacity >= clusterSize;
            const distance = haversineDistance(vehicle.location, clusters[i].centroid);
            const meetsDistance = distance <= constraints.maxDetourKm;
            
            return meetsCapacity && meetsDistance;
          })
          .map(({ index }) => index);
        
        // Add unassigned option
        eligibleVehicles.push(-1);
        
        // Pick a random option different from current
        let options = eligibleVehicles.filter(v => v !== currentVehicle);
        if (options.length === 0) {
          // If no other options, keep current
          continue;
        }
        
        const randomIndex = Math.floor(Math.random() * options.length);
        solution[i] = options[randomIndex];
      }
    }
  }
  
  /**
   * Repair solution to ensure all constraints are satisfied
   */
  private repairSolution(
    solution: number[], 
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): void {
    // Clone vehicles to track capacity
    const availableSeats = vehicles.map(v => v.availableSeats);
    
    // Calculate used capacity
    for (let i = 0; i < solution.length; i++) {
      const vehicleIndex = solution[i];
      if (vehicleIndex >= 0) {
        const clusterSize = clusters[i].requests.length;
        availableSeats[vehicleIndex] -= clusterSize;
      }
    }
    
    // Check for constraint violations
    for (let i = 0; i < solution.length; i++) {
      const vehicleIndex = solution[i];
      
      // Skip unassigned clusters
      if (vehicleIndex < 0) continue;
      
      const clusterSize = clusters[i].requests.length;
      
      // Check capacity constraint
      if (availableSeats[vehicleIndex] < 0) {
        // Capacity exceeded, unassign this cluster
        availableSeats[vehicleIndex] += clusterSize;
        solution[i] = -1;
      }
      
      // Check distance constraint
      const distance = haversineDistance(
        vehicles[vehicleIndex].location,
        clusters[i].centroid
      );
      
      if (distance > constraints.maxDetourKm) {
        // Distance exceeded, unassign this cluster
        availableSeats[vehicleIndex] += clusterSize;
        solution[i] = -1;
      }
    }
  }
  
  /**
   * Calculate fitness of a solution (higher is better)
   */
  private calculateFitness(
    solution: number[], 
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): number {
    // Calculate various metrics
    let totalAssigned = 0;
    let totalDistance = 0;
    let totalDetour = 0;
    
    // Track vehicle assignments
    const vehicleAssignments = new Map<number, Cluster[]>();
    
    // Process assignments
    for (let i = 0; i < solution.length; i++) {
      const vehicleIndex = solution[i];
      
      // Skip unassigned clusters
      if (vehicleIndex < 0) continue;
      
      const cluster = clusters[i];
      totalAssigned += cluster.requests.length;
      
      // Add to vehicle assignments
      if (!vehicleAssignments.has(vehicleIndex)) {
        vehicleAssignments.set(vehicleIndex, []);
      }
      const vehicleClusters = vehicleAssignments.get(vehicleIndex);
      if (vehicleClusters) {
        vehicleClusters.push(cluster);
      }
    }
    
    // Calculate route distances
    for (const [vehicleIndex, assignedClusters] of Array.from(vehicleAssignments.entries())) {
      const vehicle = vehicles[vehicleIndex];
      
      // Simple route: vehicle -> all pickups -> all dropoffs
      let routePoints: Coordinates[] = [vehicle.location];
      
      // Add pickup points
      const pickupPoints = assignedClusters.flatMap(
        (cluster: Cluster) => cluster.requests.map((req: RideRequest) => req.pickupLocation)
      );
      routePoints = [...routePoints, ...pickupPoints];
      
      // Add dropoff points
      const dropoffPoints = assignedClusters.flatMap(
        (cluster: Cluster) => cluster.requests.map((req: RideRequest) => req.dropoffLocation)
      );
      routePoints = [...routePoints, ...dropoffPoints];
      
      // Calculate route distance
      let routeDistance = 0;
      for (let i = 0; i < routePoints.length - 1; i++) {
        routeDistance += haversineDistance(routePoints[i], routePoints[i + 1]);
      }
      
      totalDistance += routeDistance;
      
      // Calculate direct distances (for detour calculation)
      const directDistances = assignedClusters.flatMap((cluster: Cluster) => 
        cluster.requests.map((req: RideRequest) => 
          haversineDistance(vehicle.location, req.dropoffLocation)
        )
      );
      
      const totalDirectDistance = directDistances.reduce(
        (sum: number, dist: number) => sum + dist, 
        0
      );
      totalDetour += routeDistance - totalDirectDistance;
    }
    
    // Calculate fitness score - weighted combination of objectives
    const maxPossibleAssigned = clusters.reduce(
      (sum, cluster) => sum + cluster.requests.length, 
      0
    );
    
    const assignmentRatio = totalAssigned / maxPossibleAssigned;
    const normalizedDetour = Math.min(totalDetour / (totalAssigned || 1) / constraints.maxDetourKm, 1);
    
    // Calculate vehicle utilization penalty
    const usedVehicles = vehicleAssignments.size;
    const totalVehicles = vehicles.length;
    const vehicleUtilization = usedVehicles / totalVehicles;
    
    // Strongly penalize unused vehicles
    const unusedVehiclePenalty = (totalVehicles - usedVehicles) * 0.1;
    
    // Fitness function weights - prioritize assignment ratio and vehicle utilization
    const w1 = 0.8; // Assignment ratio weight (increased from 0.7)
    const w2 = 0.15; // Detour minimization weight (decreased from 0.3)
    const w3 = 0.05; // Vehicle utilization weight (new)
    
    return w1 * assignmentRatio - w2 * normalizedDetour + w3 * vehicleUtilization - unusedVehiclePenalty;
  }
  
  /**
   * Find the best solution in the population
   */
  private findBestSolution(
    population: number[][],
    clusters: Cluster[], 
    vehicles: Vehicle[],
    constraints: { maxDetourKm: number }
  ): number[] {
    // Return any solution for an empty population
    if (population.length === 0) {
      return [];
    }
    
    // Find the best solution by fitness
    let bestSolution = population[0];
    let bestFitness = this.calculateFitness(bestSolution, clusters, vehicles, constraints);
    
    for (let i = 1; i < population.length; i++) {
      const fitness = this.calculateFitness(population[i], clusters, vehicles, constraints);
      if (fitness > bestFitness) {
        bestSolution = population[i];
        bestFitness = fitness;
      }
    }
    
    return [...bestSolution];
  }
  
  /**
   * Convert a solution to assignments
   */
  private solutionToAssignments(
    solution: number[], 
    clusters: Cluster[], 
    vehicles: Vehicle[]
  ): Assignment[] {
    // Group clusters by vehicle
    const vehicleToClusters = new Map<number, Cluster[]>();
    
    for (let i = 0; i < solution.length; i++) {
      const vehicleIndex = solution[i];
      
      // Skip unassigned clusters
      if (vehicleIndex < 0) continue;
      
      if (!vehicleToClusters.has(vehicleIndex)) {
        vehicleToClusters.set(vehicleIndex, []);
      }
      
      const vehicleClusters = vehicleToClusters.get(vehicleIndex);
      if (vehicleClusters) {
        vehicleClusters.push(clusters[i]);
      }
    }
    
    // Convert to assignments
    const assignments: Assignment[] = [];
    
    for (const [vehicleIndex, assignedClusters] of Array.from(vehicleToClusters.entries())) {
      const vehicle = vehicles[vehicleIndex];
      
      // Extract all request IDs
      const requestIds = assignedClusters.flatMap(
        cluster => cluster.requests.map(req => req.id)
      );
      
      // Create simple route: vehicle -> pickups -> dropoffs
      let route: Coordinates[] = [vehicle.location];
      
      // Add pickup locations
      const pickupLocations = assignedClusters.flatMap(
        cluster => cluster.requests.map(req => req.pickupLocation)
      );
      route = [...route, ...pickupLocations];
      
      // Add dropoff locations
      const dropoffLocations = assignedClusters.flatMap(
        cluster => cluster.requests.map(req => req.dropoffLocation)
      );
      route = [...route, ...dropoffLocations];
      
      // Create assignment
      assignments.push({
        vehicleId: vehicle.id,
        requestIds,
        route
      });
    }
    
    return assignments;
  }

  /**
   * Post-process solution to assign idle vehicles to unassigned clusters
   * This improves passenger matching by utilizing all available vehicles
   */
  private postProcessSolution(
    solution: number[], 
    clusters: Cluster[], 
    vehicles: Vehicle[], 
    constraints: { maxDetourKm: number }
  ): number[] {
    const improvedSolution = [...solution];
    
    // Track vehicle capacity
    const availableSeats = vehicles.map(v => v.availableSeats);
    
    // Calculate used capacity from current assignments
    for (let i = 0; i < improvedSolution.length; i++) {
      const vehicleIndex = improvedSolution[i];
      if (vehicleIndex >= 0) {
        const clusterSize = clusters[i].requests.length;
        availableSeats[vehicleIndex] -= clusterSize;
      }
    }
    
    // Find unassigned clusters
    const unassignedClusters: number[] = [];
    for (let i = 0; i < improvedSolution.length; i++) {
      if (improvedSolution[i] === -1) {
        unassignedClusters.push(i);
      }
    }
    
    // Find idle vehicles (with full capacity)
    const idleVehicles: number[] = [];
    for (let i = 0; i < vehicles.length; i++) {
      if (availableSeats[i] === vehicles[i].availableSeats) {
        idleVehicles.push(i);
      }
    }
    
    // Sort unassigned clusters by size (larger clusters first for better efficiency)
    unassignedClusters.sort((a, b) => clusters[b].requests.length - clusters[a].requests.length);
    
    // Try to assign idle vehicles to unassigned clusters
    for (const clusterIndex of unassignedClusters) {
      const cluster = clusters[clusterIndex];
      const clusterSize = cluster.requests.length;
      
      // Find the best idle vehicle for this cluster
      let bestVehicleIndex = -1;
      let bestDistance = Infinity;
      
      for (const vehicleIndex of idleVehicles) {
        const vehicle = vehicles[vehicleIndex];
        
        // Check capacity constraint
        if (vehicle.availableSeats < clusterSize) continue;
        
        // Check distance constraint (with some flexibility)
        const distance = haversineDistance(vehicle.location, cluster.centroid);
        
        // Allow slightly longer distances for better matching (1.5x the constraint)
        if (distance <= constraints.maxDetourKm * 1.5 && distance < bestDistance) {
          bestVehicleIndex = vehicleIndex;
          bestDistance = distance;
        }
      }
      
      // Assign the best vehicle if found
      if (bestVehicleIndex !== -1) {
        improvedSolution[clusterIndex] = bestVehicleIndex;
        availableSeats[bestVehicleIndex] -= clusterSize;
        
        // Remove vehicle from idle list if it's now fully utilized
        if (availableSeats[bestVehicleIndex] === 0) {
          const idleIndex = idleVehicles.indexOf(bestVehicleIndex);
          if (idleIndex !== -1) {
            idleVehicles.splice(idleIndex, 1);
          }
        }
      }
    }
    
    // If we still have idle vehicles and unassigned clusters, try more aggressive assignment
    const remainingUnassigned = improvedSolution.filter(assignment => assignment === -1).length;
    if (idleVehicles.length > 0 && remainingUnassigned > 0) {
      this.aggressiveAssignment(improvedSolution, clusters, vehicles, availableSeats, idleVehicles, constraints);
    }
    
    return improvedSolution;
  }
  
  /**
   * More aggressive assignment for remaining idle vehicles
   * Uses relaxed constraints to maximize passenger matching
   */
  private aggressiveAssignment(
    solution: number[],
    clusters: Cluster[],
    vehicles: Vehicle[],
    availableSeats: number[],
    idleVehicles: number[],
    constraints: { maxDetourKm: number }
  ): void {
    // Find remaining unassigned clusters
    const unassignedClusters: number[] = [];
    for (let i = 0; i < solution.length; i++) {
      if (solution[i] === -1) {
        unassignedClusters.push(i);
      }
    }
    
    // Sort by cluster size (larger first)
    unassignedClusters.sort((a, b) => clusters[b].requests.length - clusters[a].requests.length);
    
    for (const clusterIndex of unassignedClusters) {
      const cluster = clusters[clusterIndex];
      const clusterSize = cluster.requests.length;
      
      // Find any idle vehicle that can serve this cluster
      for (const vehicleIndex of idleVehicles) {
        const vehicle = vehicles[vehicleIndex];
        
        // Check capacity constraint
        if (vehicle.availableSeats < clusterSize) continue;
        
        // Very relaxed distance constraint (2x the original)
        const distance = haversineDistance(vehicle.location, cluster.centroid);
        if (distance <= constraints.maxDetourKm * 2.0) {
          solution[clusterIndex] = vehicleIndex;
          availableSeats[vehicleIndex] -= clusterSize;
          
          // Remove vehicle from idle list
          const idleIndex = idleVehicles.indexOf(vehicleIndex);
          if (idleIndex !== -1) {
            idleVehicles.splice(idleIndex, 1);
          }
          break;
        }
      }
    }
  }
} 