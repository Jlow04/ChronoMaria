import random
import time
from typing import List, Dict, Tuple

class GeneticAlgorithm:
    def __init__(self, faculty, subjects, rooms, population_size=100, mutation_rate=0.1, max_generations=1000, max_runtime_seconds=20):
        self.faculty = faculty
        self.subjects = subjects
        self.rooms = rooms
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.max_generations = max_generations
        self.max_runtime_seconds = max_runtime_seconds
        
        # Time slots: Days and periods
        self.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        self.time_slots = [
            '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
            '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
        ]

        self.faculty_by_id = {member.get('id'): member for member in self.faculty if member.get('id') is not None}
        self.subject_by_id = {subject.get('id'): subject for subject in self.subjects if subject.get('id') is not None}
        self.faculty_by_department = {}
        for member in self.faculty:
            dept = self._normalize_department(member.get('department'))
            if dept not in self.faculty_by_department:
                self.faculty_by_department[dept] = []
            self.faculty_by_department[dept].append(member)

    def _clone_individual(self, individual: List[Dict]) -> List[Dict]:
        return [gene.copy() for gene in individual]

    def _parse_preferred_subjects(self, value: str) -> List[str]:
        if not value:
            return []
        return [item.strip().lower() for item in str(value).split(',') if item.strip()]

    def _normalize_token(self, value: str) -> str:
        return ''.join(ch for ch in str(value or '').lower() if ch.isalnum())

    def _is_preferred_match(self, faculty: Dict, subject: Dict) -> bool:
        preferred_raw = self._parse_preferred_subjects(faculty.get('preferred_subjects'))
        if not preferred_raw:
            return False

        preferred = [self._normalize_token(item) for item in preferred_raw]
        subject_name = self._normalize_token(subject.get('name'))
        subject_codes = [
            self._normalize_token(subject.get('code')),
            self._normalize_token(subject.get('CODE')),
            self._normalize_token(subject.get('course_no')),
            self._normalize_token(subject.get('Course_No.')),
        ]
        subject_codes = [code for code in subject_codes if code]

        for pref in preferred:
            if not pref:
                continue
            if pref == subject_name:
                return True
            if any(pref == code for code in subject_codes):
                return True
            if subject_name and pref in subject_name:
                return True
            if any(pref in code for code in subject_codes):
                return True

        return False

    def _normalize_department(self, value: str) -> str:
        text = str(value or '').strip().lower()
        aliases = {
            'general education': 'general education',
            'gen ed': 'general education',
            'physical education': 'general education',
            'pe': 'general education',
            'theology': 'general education',
            'architecture': 'architecture',
            'engineering': 'engineering',
            'mathematics': 'mathematics',
            'math': 'mathematics',
            'computer science': 'computer science',
            'information technology': 'information technology',
        }
        return aliases.get(text, text)

    def _faculty_candidates_for_subject(self, subject: Dict) -> List[Dict]:
        subject_dept = self._normalize_department(subject.get('department'))
        dept_candidates = self.faculty_by_department.get(subject_dept, [])
        if dept_candidates:
            return dept_candidates

        if subject_dept in ['general education', 'mathematics']:
            fallback = self.faculty_by_department.get('general education', []) + self.faculty_by_department.get('mathematics', [])
            if fallback:
                return fallback

        return self.faculty

    def _strict_faculty_candidates_for_subject(self, subject: Dict) -> List[Dict]:
        subject_dept = self._normalize_department(subject.get('department'))
        dept_candidates = self.faculty_by_department.get(subject_dept, [])
        if dept_candidates:
            return dept_candidates

        # For broad foundational offerings, allow the education cluster.
        if subject_dept in ['general education', 'mathematics']:
            fallback = self.faculty_by_department.get('general education', []) + self.faculty_by_department.get('mathematics', [])
            if fallback:
                return fallback

        # No strict candidates available.
        return []

    def _pick_faculty_for_subject(self, subject: Dict, candidates: List[Dict], current_units: Dict[int, int] = None) -> Dict:
        if not candidates:
            return {}

        current_units = current_units or {}
        preferred_candidates = [member for member in candidates if self._is_preferred_match(member, subject)]
        pool = preferred_candidates if preferred_candidates else candidates

        min_units = None
        best = []
        for member in pool:
            fid = member.get('id')
            units = current_units.get(fid, 0)
            if min_units is None or units < min_units:
                min_units = units
                best = [member]
            elif units == min_units:
                best.append(member)

        return random.choice(best) if best else random.choice(pool)

    def _repair_individual(self, individual: List[Dict]) -> List[Dict]:
        repaired = self._clone_individual(individual)
        units_by_faculty = {}

        for gene in repaired:
            fid = gene.get('faculty_id')
            subject = self.subject_by_id.get(gene.get('subject_id'), {})
            if fid is not None:
                units_by_faculty[fid] = units_by_faculty.get(fid, 0) + int(subject.get('units') or 0)

        for idx, gene in enumerate(repaired):
            subject = self.subject_by_id.get(gene.get('subject_id'), {})
            strict_candidates = self._strict_faculty_candidates_for_subject(subject)
            if not strict_candidates:
                continue

            allowed_ids = {member.get('id') for member in strict_candidates}
            requires_fix = gene.get('faculty_id') not in allowed_ids

            if not requires_fix:
                assigned = self.faculty_by_id.get(gene.get('faculty_id'), {})
                preferred_exists = any(self._is_preferred_match(member, subject) for member in strict_candidates)
                if preferred_exists and not self._is_preferred_match(assigned, subject):
                    requires_fix = True

            if requires_fix:
                old_fid = gene.get('faculty_id')
                chosen = self._pick_faculty_for_subject(subject, strict_candidates, units_by_faculty)
                gene['faculty'] = chosen.get('name', 'Unknown')
                gene['faculty_id'] = chosen.get('id')

                subject_units = int(subject.get('units') or 0)
                if old_fid is not None:
                    units_by_faculty[old_fid] = max(0, units_by_faculty.get(old_fid, 0) - subject_units)
                new_fid = chosen.get('id')
                if new_fid is not None:
                    units_by_faculty[new_fid] = units_by_faculty.get(new_fid, 0) + subject_units

                repaired[idx] = gene

        return repaired
    
    def create_individual(self) -> List[Dict]:
        """Create a random schedule (individual)"""
        schedule = []
        units_by_faculty = {}
        for subject in self.subjects:
            candidates = self._faculty_candidates_for_subject(subject)
            chosen_faculty = self._pick_faculty_for_subject(subject, candidates, units_by_faculty)
            chosen_room = random.choice(self.rooms) if self.rooms else {}

            fid = chosen_faculty.get('id')
            if fid is not None:
                units_by_faculty[fid] = units_by_faculty.get(fid, 0) + int(subject.get('units') or 0)

            gene = {
                'subject': subject.get('name', 'Unknown Subject'),
                'subject_id': subject.get('id'),
                'faculty': chosen_faculty.get('name', 'TBA'),
                'faculty_id': chosen_faculty.get('id'),
                'room': chosen_room.get('room_number', 'TBA'),
                'room_id': chosen_room.get('id'),
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
        # Scale base score with problem size, then normalize back to 0-100.
        # A fixed base of 100 is too small for larger schedules and gets clamped to 0.
        base_fitness = 100.0 + (len(individual) * 20.0)
        fitness = base_fitness
        
        # Check for time conflicts (faculty)
        faculty_schedule = {}
        for gene in individual:
            subject = self.subject_by_id.get(gene.get('subject_id'), {})
            strict_candidates = self._strict_faculty_candidates_for_subject(subject)
            if strict_candidates:
                allowed_ids = {member.get('id') for member in strict_candidates}
                if gene.get('faculty_id') not in allowed_ids:
                    # Soft penalty: unqualified faculty assignment.
                    fitness -= 50

                preferred_exists = any(self._is_preferred_match(member, subject) for member in strict_candidates)
                assigned = self.faculty_by_id.get(gene.get('faculty_id'), {})
                if preferred_exists and not self._is_preferred_match(assigned, subject):
                    # Soft penalty: non-preferred assignment.
                    fitness -= 20

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
        faculty_units = {}
        for gene in individual:
            fid = gene['faculty_id']
            if fid not in faculty_load:
                faculty_load[fid] = 0
            if fid not in faculty_units:
                faculty_units[fid] = 0
            faculty_load[fid] += 1

            subject = self.subject_by_id.get(gene.get('subject_id'), {})
            faculty = self.faculty_by_id.get(fid, {})
            subject_units = int(subject.get('units') or 0)
            faculty_units[fid] += subject_units

            # Penalize department mismatch between assigned faculty and subject.
            faculty_dept = self._normalize_department(faculty.get('department'))
            subject_dept = self._normalize_department(subject.get('department'))
            if faculty_dept and subject_dept and faculty_dept != subject_dept:
                fitness -= 20

            # Penalize assignments outside stated faculty preferred subjects (if provided).
            strict_candidates = self._strict_faculty_candidates_for_subject(subject)
            preferred_exists = any(self._is_preferred_match(member, subject) for member in strict_candidates)
            if preferred_exists and not self._is_preferred_match(faculty, subject):
                fitness -= 6
        
        # Penalize unbalanced workload
        if faculty_load:
            max_load = max(faculty_load.values())
            min_load = min(faculty_load.values())
            if max_load - min_load > 3:
                fitness -= 5

        # Penalize max unit violations.
        for fid, total_units in faculty_units.items():
            faculty = self.faculty_by_id.get(fid, {})
            max_units = int(faculty.get('max_units') or 18)
            if total_units > max_units:
                # Hard-ish constraint: severe violation should invalidate.
                overload = total_units - max_units
                if overload >= 3:
                    fitness -= overload * 15
                else:
                    fitness -= overload * 8
        
        normalized = (fitness / base_fitness) * 100.0 if base_fitness > 0 else 0.0
        return max(0.0, round(normalized, 2))
    
    def selection(self, population: List[List[Dict]], fitness_scores: List[float]) -> List[Dict]:
        """Tournament selection"""
        tournament_size = min(5, len(population))
        if tournament_size == 0:
            return []
        tournament = random.sample(list(zip(population, fitness_scores)), tournament_size)
        winner = max(tournament, key=lambda x: x[1])
        return winner[0]
    
    def crossover(self, parent1: List[Dict], parent2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Single-point crossover"""
        if len(parent1) < 2:
            return self._clone_individual(parent1), self._clone_individual(parent2)
        
        crossover_point = random.randint(1, len(parent1) - 1)
        child1 = self._repair_individual(self._clone_individual(parent1[:crossover_point] + parent2[crossover_point:]))
        child2 = self._repair_individual(self._clone_individual(parent2[:crossover_point] + parent1[crossover_point:]))
        return child1, child2
    
    def mutate(self, individual: List[Dict]) -> List[Dict]:
        """Randomly mutate genes"""
        mutated = self._clone_individual(individual)
        for i in range(len(mutated)):
            if random.random() < self.mutation_rate:
                gene = mutated[i].copy()
                mutation_type = random.choice(['faculty', 'room', 'time', 'day'])
                
                if mutation_type == 'faculty' and self.faculty:
                    subject = self.subject_by_id.get(gene.get('subject_id'), {})
                    candidates = self._faculty_candidates_for_subject(subject)
                    new_faculty = self._pick_faculty_for_subject(subject, candidates) if candidates else random.choice(self.faculty)
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
                
                mutated[i] = gene.copy()
        
        return self._repair_individual(mutated)
    
    def generate_report(self, individual: List[Dict], fitness: float, generations: int) -> Dict:
        """Analyze the best schedule and return a detailed quality report."""
        if not individual:
            return {"error": "Empty schedule — nothing to report."}

        # ── Faculty conflicts (same faculty, same day+time) ──────────────────
        faculty_seen = {}
        faculty_conflicts = []
        for gene in individual:
            key = f"{gene.get('faculty_id')}_{gene.get('day')}_{gene.get('time')}"
            if key in faculty_seen:
                faculty_conflicts.append({
                    "faculty": gene.get('faculty'),
                    "day": gene.get('day'),
                    "time": gene.get('time'),
                    "conflict_between": [faculty_seen[key], gene.get('subject')]
                })
            else:
                faculty_seen[key] = gene.get('subject')

        # ── Room conflicts (same room, same day+time) ─────────────────────────
        room_seen = {}
        room_conflicts = []
        for gene in individual:
            key = f"{gene.get('room_id')}_{gene.get('day')}_{gene.get('time')}"
            if key in room_seen:
                room_conflicts.append({
                    "room": gene.get('room'),
                    "day": gene.get('day'),
                    "time": gene.get('time'),
                    "conflict_between": [room_seen[key], gene.get('subject')]
                })
            else:
                room_seen[key] = gene.get('subject')

        # ── Department mismatches, unqualified & non-preferred assignments ─────
        dept_mismatches = []
        unqualified_assignments = []
        non_preferred_assignments = []

        for gene in individual:
            subject = self.subject_by_id.get(gene.get('subject_id'), {})
            faculty  = self.faculty_by_id.get(gene.get('faculty_id'), {})

            f_dept = self._normalize_department(faculty.get('department'))
            s_dept = self._normalize_department(subject.get('department'))
            if f_dept and s_dept and f_dept != s_dept:
                dept_mismatches.append({
                    "subject": gene.get('subject'),
                    "subject_dept": s_dept,
                    "faculty": gene.get('faculty'),
                    "faculty_dept": f_dept
                })

            strict = self._strict_faculty_candidates_for_subject(subject)
            if strict:
                allowed = {m.get('id') for m in strict}
                if gene.get('faculty_id') not in allowed:
                    unqualified_assignments.append({
                        "subject": gene.get('subject'),
                        "assigned_faculty": gene.get('faculty')
                    })
                else:
                    preferred_exists = any(self._is_preferred_match(m, subject) for m in strict)
                    if preferred_exists and not self._is_preferred_match(faculty, subject):
                        non_preferred_assignments.append({
                            "subject": gene.get('subject'),
                            "assigned_faculty": gene.get('faculty')
                        })

        # ── Faculty workload ──────────────────────────────────────────────────
        fac_units   = {}
        fac_subjects = {}
        for gene in individual:
            fid     = gene.get('faculty_id')
            subject = self.subject_by_id.get(gene.get('subject_id'), {})
            units   = int(subject.get('units') or 0)
            fac_units[fid]    = fac_units.get(fid, 0) + units
            fac_subjects.setdefault(fid, []).append(gene.get('subject'))

        workload = []
        overloaded = []
        for fid, units in fac_units.items():
            fac      = self.faculty_by_id.get(fid, {})
            max_u    = int(fac.get('max_units') or 18)
            entry = {
                "faculty":        fac.get('name', 'Unknown'),
                "subjects_count": len(fac_subjects.get(fid, [])),
                "total_units":    units,
                "max_units":      max_u,
                "status":         "OVERLOADED" if units > max_u else "OK"
            }
            workload.append(entry)
            if units > max_u:
                overloaded.append(entry)

        # Workload balance
        fac_load = {fid: len(subs) for fid, subs in fac_subjects.items()}
        load_imbalance = (max(fac_load.values()) - min(fac_load.values())) > 3 if fac_load else False

        # ── Penalty breakdown (mirrors calculate_fitness logic) ───────────────
        pen_faculty    = len(faculty_conflicts)  * 10
        pen_room       = len(room_conflicts)     * 10
        pen_dept       = len(dept_mismatches)    * 20
        pen_unqualified = len(unqualified_assignments) * 50
        pen_nonpref    = len(non_preferred_assignments) * (20 + 6)
        pen_overload   = sum(
            (e['total_units'] - e['max_units']) * (15 if (e['total_units'] - e['max_units']) >= 3 else 8)
            for e in overloaded
        )
        pen_imbalance  = 5 if load_imbalance else 0
        total_penalty  = pen_faculty + pen_room + pen_dept + pen_unqualified + pen_nonpref + pen_overload + pen_imbalance
        base_fitness   = 100.0 + len(individual) * 20.0

        # ── Quality label ─────────────────────────────────────────────────────
        if fitness >= 95:
            quality = "Excellent"
        elif fitness >= 80:
            quality = "Good"
        elif fitness >= 60:
            quality = "Fair"
        elif fitness >= 40:
            quality = "Poor"
        else:
            quality = "Very Poor"

        return {
            "summary": {
                "total_subjects":    len(individual),
                "total_faculty_used": len(fac_units),
                "generations_run":   generations,
                "fitness_score":     fitness,
                "quality":           quality
            },
            "conflicts": {
                "faculty_conflicts":       faculty_conflicts,
                "faculty_conflict_count":  len(faculty_conflicts),
                "room_conflicts":          room_conflicts,
                "room_conflict_count":     len(room_conflicts),
                "dept_mismatches":         dept_mismatches,
                "dept_mismatch_count":     len(dept_mismatches),
                "unqualified_assignments": unqualified_assignments,
                "unqualified_count":       len(unqualified_assignments),
                "non_preferred":           non_preferred_assignments,
                "non_preferred_count":     len(non_preferred_assignments),
                "overloaded_faculty":      overloaded,
                "overload_count":          len(overloaded),
                "workload_imbalanced":     load_imbalance
            },
            "fitness_breakdown": {
                "base_score":              base_fitness,
                "total_penalty":           total_penalty,
                "penalty_faculty_conflicts": pen_faculty,
                "penalty_room_conflicts":  pen_room,
                "penalty_dept_mismatches": pen_dept,
                "penalty_unqualified":     pen_unqualified,
                "penalty_non_preferred":   pen_nonpref,
                "penalty_overload":        pen_overload,
                "penalty_workload_imbalance": pen_imbalance
            },
            "faculty_workload": sorted(workload, key=lambda x: x['total_units'], reverse=True)
        }

    def run(self) -> Tuple[List[Dict], float, int]:
        """Run the genetic algorithm"""
        # Handle empty data gracefully
        if not self.subjects:
            return [], 0, 0
        
        population = [self._repair_individual(ind) for ind in self.create_population()]
        best_individual = None
        best_fitness = -1
        generations_run = 0
        
        start_time = time.time()
        for generation in range(self.max_generations):
            if (time.time() - start_time) >= self.max_runtime_seconds:
                break
            generations_run = generation + 1
            
            # Calculate fitness for all individuals
            fitness_scores = [self.calculate_fitness(ind) for ind in population]
            
            # Track best individual
            max_fitness_idx = fitness_scores.index(max(fitness_scores))
            if fitness_scores[max_fitness_idx] > best_fitness:
                best_fitness = fitness_scores[max_fitness_idx]
                best_individual = self._clone_individual(population[max_fitness_idx])
            
            # Early stopping if perfect solution found
            if best_fitness >= 100:
                break
            
            # Create new population
            new_population = []
            
            # Elitism: keep best individual
            new_population.append(self._clone_individual(best_individual))
            
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
