import random
from typing import List, Dict, Tuple

class GeneticAlgorithm:
    def __init__(self, faculty, subjects, rooms, population_size=100, mutation_rate=0.1, max_generations=1000):
        self.faculty = faculty
        self.subjects = subjects
        self.rooms = rooms
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.max_generations = max_generations
        
        # Time slots: Days and periods
        self.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        self.time_slots = [
            '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
            '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
        ]
    
    def create_individual(self) -> List[Dict]:
        """Create a random schedule (individual)"""
        schedule = []
        for subject in self.subjects:
            gene = {
                'subject': subject.get('name', 'Unknown Subject'),
                'subject_id': subject.get('id'),
                'faculty': random.choice(self.faculty).get('name', 'Unknown') if self.faculty else 'TBA',
                'faculty_id': random.choice(self.faculty).get('id') if self.faculty else None,
                'room': random.choice(self.rooms).get('room_number', 'TBA') if self.rooms else 'TBA',
                'room_id': random.choice(self.rooms).get('id') if self.rooms else None,
                'day': random.choice(self.days),
                'time': random.choice(self.time_slots)
            }
            schedule.append(gene)
        return schedule
    
    def create_population(self) -> List[List[Dict]]:
        """Create initial population"""
        return [self.create_individual() for _ in range(self.population_size)]
    
    def calculate_fitness(self, individual: List[Dict]) -> float:
        """
        Calculate fitness score for a schedule.
        Higher score = better schedule
        Penalize:
        - Faculty teaching at the same time
        - Room conflicts (same room, same time)
        - Faculty overload (too many units)
        """
        fitness = 100.0
        
        # Check for time conflicts (faculty)
        faculty_schedule = {}
        for gene in individual:
            key = f"{gene['faculty_id']}_{gene['day']}_{gene['time']}"
            if key in faculty_schedule:
                fitness -= 10  # Penalty for faculty conflict
            faculty_schedule[key] = True
        
        # Check for room conflicts
        room_schedule = {}
        for gene in individual:
            key = f"{gene['room_id']}_{gene['day']}_{gene['time']}"
            if key in room_schedule:
                fitness -= 10  # Penalty for room conflict
            room_schedule[key] = True
        
        # Check faculty workload (simplified)
        faculty_load = {}
        for gene in individual:
            fid = gene['faculty_id']
            if fid not in faculty_load:
                faculty_load[fid] = 0
            faculty_load[fid] += 1
        
        # Penalize unbalanced workload
        if faculty_load:
            max_load = max(faculty_load.values())
            min_load = min(faculty_load.values())
            if max_load - min_load > 3:
                fitness -= 5
        
        return max(0, fitness)
    
    def selection(self, population: List[List[Dict]], fitness_scores: List[float]) -> List[Dict]:
        """Tournament selection"""
        tournament_size = 5
        tournament = random.sample(list(zip(population, fitness_scores)), tournament_size)
        winner = max(tournament, key=lambda x: x[1])
        return winner[0]
    
    def crossover(self, parent1: List[Dict], parent2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Single-point crossover"""
        if len(parent1) < 2:
            return parent1.copy(), parent2.copy()
        
        crossover_point = random.randint(1, len(parent1) - 1)
        child1 = parent1[:crossover_point] + parent2[crossover_point:]
        child2 = parent2[:crossover_point] + parent1[crossover_point:]
        return child1, child2
    
    def mutate(self, individual: List[Dict]) -> List[Dict]:
        """Randomly mutate genes"""
        mutated = individual.copy()
        for i in range(len(mutated)):
            if random.random() < self.mutation_rate:
                gene = mutated[i].copy()
                mutation_type = random.choice(['faculty', 'room', 'time', 'day'])
                
                if mutation_type == 'faculty' and self.faculty:
                    new_faculty = random.choice(self.faculty)
                    gene['faculty'] = new_faculty.get('name', 'Unknown')
                    gene['faculty_id'] = new_faculty.get('id')
                elif mutation_type == 'room' and self.rooms:
                    new_room = random.choice(self.rooms)
                    gene['room'] = new_room.get('room_number', 'TBA')
                    gene['room_id'] = new_room.get('id')
                elif mutation_type == 'time':
                    gene['time'] = random.choice(self.time_slots)
                elif mutation_type == 'day':
                    gene['day'] = random.choice(self.days)
                
                mutated[i] = gene
        
        return mutated
    
    def run(self) -> Tuple[List[Dict], float, int]:
        """Run the genetic algorithm"""
        # Handle empty data gracefully
        if not self.subjects:
            return [], 0, 0
        
        population = self.create_population()
        best_individual = None
        best_fitness = -1
        generations_run = 0
        
        for generation in range(self.max_generations):
            generations_run = generation + 1
            
            # Calculate fitness for all individuals
            fitness_scores = [self.calculate_fitness(ind) for ind in population]
            
            # Track best individual
            max_fitness_idx = fitness_scores.index(max(fitness_scores))
            if fitness_scores[max_fitness_idx] > best_fitness:
                best_fitness = fitness_scores[max_fitness_idx]
                best_individual = population[max_fitness_idx].copy()
            
            # Early stopping if perfect solution found
            if best_fitness >= 100:
                break
            
            # Create new population
            new_population = []
            
            # Elitism: keep best individual
            new_population.append(best_individual)
            
            # Generate rest of population
            while len(new_population) < self.population_size:
                parent1 = self.selection(population, fitness_scores)
                parent2 = self.selection(population, fitness_scores)
                
                child1, child2 = self.crossover(parent1, parent2)
                
                child1 = self.mutate(child1)
                child2 = self.mutate(child2)
                
                new_population.append(child1)
                if len(new_population) < self.population_size:
                    new_population.append(child2)
            
            population = new_population
        
        return best_individual if best_individual else [], best_fitness, generations_run
