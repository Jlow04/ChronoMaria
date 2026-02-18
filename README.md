# ChronoMaria - Faculty Loading Automation System

A web-based faculty loading automation system using genetic algorithms to optimize schedule generation.

## Project Structure

```
ChronoMaria/
├── backend/              # Node.js Express backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── server.js         # Main server file
│   └── package.json
├── frontend/             # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── genetic_algorithm/    # Python GA module
│   ├── genetic_algorithm.py
│   ├── server.py
│   └── requirements.txt
└── README.md
```

## Features

- **Faculty Management**: Add, edit, and delete faculty members
- **Subject Management**: Manage subjects and course offerings
- **Room Management**: Track classrooms and their capacities
- **Schedule Generation**: Automated schedule creation using genetic algorithms
- **Conflict Detection**: Identifies and resolves scheduling conflicts

## Technology Stack

### Backend
- Node.js with Express
- PostgreSQL database
- CORS enabled
- RESTful API architecture

### Frontend
- React 18
- Vite for fast development
- React Router for navigation
- Axios for API calls
- Modern CSS styling

### Genetic Algorithm
- Python 3.x
- Flask API server
- Custom GA implementation

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE chronomaria;
```

2. Run the database schema (see DATABASE.md for full schema)

3. Create a `.env` file in the `backend` directory:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=chronomaria
PYTHON_SERVICE_URL=http://localhost:8000
```

### Backend Setup

```bash
cd backend
npm install
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

### Genetic Algorithm Service Setup

```bash
cd genetic_algorithm
pip install -r requirements.txt
python server.py
```

The GA service will run on `http://localhost:8000`

## Usage

1. **Login**: Access the system through the login page
2. **Manage Data**: 
   - Add faculty members with their details and preferences
   - Add subjects with units and hours
   - Add rooms with capacity and type
3. **Generate Schedule**:
   - Navigate to the Schedule page
   - Configure GA parameters (population size, mutation rate, generations)
   - Click "Generate Schedule" to create an optimized schedule
4. **View Results**: Review the generated schedule with all assignments

## API Endpoints

### Faculty
- `GET /api/faculty` - Get all faculty
- `GET /api/faculty/:id` - Get faculty by ID
- `POST /api/faculty` - Create faculty
- `PUT /api/faculty/:id` - Update faculty
- `DELETE /api/faculty/:id` - Delete faculty

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get subject by ID
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Schedule
- `POST /api/schedule/generate` - Generate schedule using GA
- `POST /api/schedule/validate` - Validate a schedule

## Genetic Algorithm

The genetic algorithm optimizes schedules by:

1. **Initialization**: Creates random population of schedules
2. **Fitness Evaluation**: Scores schedules based on constraints
3. **Selection**: Chooses best schedules for reproduction
4. **Crossover**: Combines parent schedules to create offspring
5. **Mutation**: Introduces random changes for diversity
6. **Iteration**: Repeats until optimal solution found

### Constraints
- No faculty time conflicts
- No room double-bookings
- Balanced faculty workload
- Faculty preferences respected

## Development

### Backend Development
- Models use PostgreSQL with pg library
- Controllers handle business logic
- Routes define API endpoints
- Database connection in config/database.js

### Frontend Development
- Pages in `src/pages/`
- Shared components in `src/components/`
- API services in `src/services/`
- Routing configured in App.jsx

### Adding New Features
1. Create database schema changes
2. Add/update models in backend
3. Create/update controllers
4. Define routes
5. Create/update frontend pages
6. Connect to API services

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify .env configuration
- Ensure database exists

### Frontend won't connect
- Check backend is running on port 5000
- Verify CORS is enabled
- Check proxy configuration in vite.config.js

### GA service errors
- Ensure Python dependencies installed
- Check port 8000 is available
- Verify backend can reach Python service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Authors

ChronoMaria Development Team

## Acknowledgments

- Genetic algorithm implementation based on standard GA principles
- UI design inspired by modern web applications
- Built with love for educational institutions
