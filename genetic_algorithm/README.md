# Genetic Algorithm Module for ChronoMaria

This module implements a genetic algorithm for optimizing faculty loading schedules.

## Components

### 1. Chromosome Representation
Each schedule is represented as a list of genes, where each gene contains:
- Subject assignment
- Faculty assignment
- Room assignment
- Time slot (day and period)

### 2. Fitness Function
The fitness function evaluates schedules based on:
- No faculty conflicts (same faculty, same time)
- No room conflicts (same room, same time)
- Balanced faculty workload
- Faculty preferences matching

Higher fitness = better schedule

### 3. Selection
Tournament selection is used to choose parents for reproduction.

### 4. Crossover
Single-point crossover combines two parent schedules to create offspring.

### 5. Mutation
Random mutations modify genes to maintain genetic diversity:
- Change faculty assignment
- Change room assignment
- Change time slot
- Change day

## Usage

```python
from genetic_algorithm import GeneticAlgorithm

ga = GeneticAlgorithm(
    faculty=faculty_list,
    subjects=subject_list,
    rooms=room_list,
    population_size=100,
    mutation_rate=0.1,
    max_generations=1000
)

best_schedule, fitness, generations = ga.run()
```

## Parameters

- **population_size**: Number of schedules in each generation (default: 100)
- **mutation_rate**: Probability of gene mutation (default: 0.1)
- **max_generations**: Maximum iterations (default: 1000)

## Constraints Handled

1. Faculty cannot teach multiple subjects simultaneously
2. Rooms cannot be double-booked
3. Faculty workload should be balanced
4. Time slots must be valid
