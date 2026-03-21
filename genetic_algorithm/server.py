from flask import Flask, request, jsonify
from flask_cors import CORS
from genetic_algorithm import GeneticAlgorithm
import json
import os

app = Flask(__name__)
CORS(app)


def _print_report(report: dict):
    """Print a human-readable schedule quality report to the console."""
    SEP  = "=" * 60
    LINE = "-" * 60

    s  = report.get("summary", {})
    c  = report.get("conflicts", {})
    fb = report.get("fitness_breakdown", {})
    wl = report.get("faculty_workload", [])

    print(f"\n{SEP}")
    print("  SCHEDULE GENERATION REPORT")
    print(SEP)

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n[SUMMARY]")
    print(f"  Fitness Score  : {s.get('fitness_score')} / 100  ({s.get('quality', '?')})")
    print(f"  Subjects       : {s.get('total_subjects')}")
    print(f"  Faculty Used   : {s.get('total_faculty_used')}")
    print(f"  Generations    : {s.get('generations_run')}")

    # ── Conflicts & Issues ────────────────────────────────────────────────────
    print(f"\n[CONFLICTS & ISSUES]")
    print(f"  Faculty Conflicts      : {c.get('faculty_conflict_count', 0)}")
    for item in c.get("faculty_conflicts", []):
        print(f"    * {item['faculty']} — {item['day']} {item['time']}: {item['conflict_between']}")

    print(f"  Room Conflicts         : {c.get('room_conflict_count', 0)}")
    for item in c.get("room_conflicts", []):
        print(f"    * Room {item['room']} — {item['day']} {item['time']}: {item['conflict_between']}")

    print(f"  Dept Mismatches        : {c.get('dept_mismatch_count', 0)}")
    for item in c.get("dept_mismatches", []):
        print(f"    * {item['subject']} ({item['subject_dept']}) <- {item['faculty']} ({item['faculty_dept']})")

    print(f"  Unqualified Assign.    : {c.get('unqualified_count', 0)}")
    for item in c.get("unqualified_assignments", []):
        print(f"    * {item['subject']} <- {item['assigned_faculty']}")

    print(f"  Non-Preferred Assign.  : {c.get('non_preferred_count', 0)}")
    for item in c.get("non_preferred", []):
        print(f"    * {item['subject']} <- {item['assigned_faculty']}")

    print(f"  Overloaded Faculty     : {c.get('overload_count', 0)}")
    for item in c.get("overloaded_faculty", []):
        print(f"    * {item['faculty']}: {item['total_units']} units (max {item['max_units']})")

    print(f"  Workload Imbalanced    : {'Yes' if c.get('workload_imbalanced') else 'No'}")

    # ── Fitness Breakdown ─────────────────────────────────────────────────────
    print(f"\n[FITNESS BREAKDOWN]")
    base = fb.get("base_score", 0)
    print(f"  Base Score             :  {base}")
    print(f"  - Faculty Conflicts    : -{fb.get('penalty_faculty_conflicts', 0):<5}  ({c.get('faculty_conflict_count', 0)} x -10)")
    print(f"  - Room Conflicts       : -{fb.get('penalty_room_conflicts', 0):<5}  ({c.get('room_conflict_count', 0)} x -10)")
    print(f"  - Dept Mismatches      : -{fb.get('penalty_dept_mismatches', 0):<5}  ({c.get('dept_mismatch_count', 0)} x -20)")
    print(f"  - Unqualified Assign.  : -{fb.get('penalty_unqualified', 0):<5}  ({c.get('unqualified_count', 0)} x -50)")
    print(f"  - Non-Preferred        : -{fb.get('penalty_non_preferred', 0):<5}  ({c.get('non_preferred_count', 0)} x -26)")
    print(f"  - Overload Penalty     : -{fb.get('penalty_overload', 0)}")
    print(f"  - Workload Imbalance   : -{fb.get('penalty_workload_imbalance', 0)}")
    print(f"  {LINE[:40]}")
    print(f"  Total Penalty          : -{fb.get('total_penalty', 0)}")
    print(f"  Final Score (0-100)    :  {s.get('fitness_score')}")

    # ── Faculty Workload ──────────────────────────────────────────────────────
    print(f"\n[FACULTY WORKLOAD]")
    for entry in wl:
        status = "  <-- OVERLOADED" if entry['status'] == "OVERLOADED" else ""
        print(f"  {entry['faculty']:<30}  {entry['subjects_count']} subjects  {entry['total_units']}/{entry['max_units']} units{status}")

    print(f"\n{SEP}\n")


@app.route('/generate', methods=['POST'])
def generate_schedule():
    try:
        data = request.json
        faculty = data.get('faculty', [])
        subjects = data.get('subjects', [])
        rooms = data.get('rooms', [])
        constraints = data.get('constraints', {})
        
        # Initialize genetic algorithm
        ga = GeneticAlgorithm(
            faculty=faculty,
            subjects=subjects,
            rooms=rooms,
            population_size=constraints.get('population_size', 100),
            mutation_rate=constraints.get('mutation_rate', 0.1),
            max_generations=constraints.get('max_generations', 1000),
            max_runtime_seconds=constraints.get('max_runtime_seconds', 20)
        )
        
        # Run the genetic algorithm
        best_schedule, fitness, generations = ga.run()

        # Generate and print the quality report
        report = ga.generate_report(best_schedule, fitness, generations)
        _print_report(report)

        return jsonify({
            'schedule': best_schedule,
            'fitness': fitness,
            'generations': generations,
            'report': report
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Genetic Algorithm Service is running'})

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=8000, debug=debug_mode, use_reloader=False)
