from flask import Flask, request, jsonify
from flask_cors import CORS
from genetic_algorithm import GeneticAlgorithm
import json
import os

app = Flask(__name__)
CORS(app)

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
        
        return jsonify({
            'schedule': best_schedule,
            'fitness': fitness,
            'generations': generations
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Genetic Algorithm Service is running'})

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=8000, debug=debug_mode, use_reloader=False)
