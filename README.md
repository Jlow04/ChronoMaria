# ChronoMaria - Faculty Loading Automation System

A web-based faculty loading automation system using genetic algorithms to optimize class schedule generation. Built with React, Node.js/Express, Python, and Supabase.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Python](https://img.shields.io/badge/python-%3E%3D3.8.0-blue.svg)

## 🚀 Quick Start

**For Team Members Cloning from GitHub:**
1. Install [Node.js](https://nodejs.org/) (v16+) and [Python](https://www.python.org/downloads/) (v3.8+)
2. Clone this repository: `git clone <repository-url>`
3. Install dependencies for backend, frontend, and Python (see Installation section below)
4. Get `.env` credentials from your team lead
5. Run all three services (backend, frontend, Python GA)
6. Open http://localhost:3000

**⏱️ Setup time:** ~10 minutes (database already configured!)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v16.0.0 or higher)
   - Download: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`
   - ⚠️ **Important**: During installation, check "Automatically install necessary tools"

2. **Python** (v3.8.0 or higher)
   - Download: https://www.python.org/downloads/
   - ⚠️ **Important**: Check "Add Python to PATH" during installation
   - Verify installation: `python --version` and `pip --version`

3. **Git** (for cloning the repository)
   - Download: https://git-scm.com/downloads
   - Verify installation: `git --version`



### Optional (Recommended)

- **Git** for version control: https://git-scm.com/
- **VS Code** for editing: https://code.visualstudio.com/

## 🗂️ Project Structure

```
ChronoMaria/
├── backend/              # Node.js Express REST API
│   ├── config/           # Supabase client configuration
│   ├── controllers/      # Business logic
│   ├── models/           # Data models (Supabase)
│   ├── routes/           # API endpoints
│   ├── server.js         # Main server file
│   └── package.json
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (Login, Dashboard, etc.)
│   │   ├── services/     # API service layer
│   │   └── App.jsx       # Main app component
│   └── package.json
├── genetic_algorithm/    # Python Flask service
│   ├── genetic_algorithm.py  # GA implementation
│   ├── server.py         # Flask API server
│   └── requirements.txt
└── README.md
```

## ⚙️ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ChronoMaria
```

> **Note**: The database is already configured on Supabase. You just need to get the credentials from your team lead and add them to your `.env` file.

### Step 2: Install Prerequisites

Before starting, ensure you have these installed on your machine:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
  - ⚠️ During Python installation, check "Add Python to PATH"

### Step 3: Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### Python Dependencies
```bash
cd ../genetic_algorithm
pip install -r requirements.txt
```

> **Windows Users**: If you get a "script execution" error, run this in PowerShell as Administrator:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### Step 4: Configure Environment Variables

1. **Get credentials from your team lead** (Supabase URL, Anon Key, and Database Password)

2. **Create the `.env` file** in the `backend/` folder:
   ```bash
   cd backend
   # Copy the example file
   copy .env.example .env    # Windows
   # cp .env.example .env    # Mac/Linux
   ```

3. **Edit `backend/.env`** with the credentials provided by your team lead:
   ```env
   PORT=5000

   # Get these from your team lead
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   
   DB_HOST=db.your-project-id.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your-database-password
   DB_NAME=postgres
   DB_SSL=true

   PYTHON_SERVICE_URL=http://localhost:8000
   ```


### Step 5: Verify Setup

Test that the backend can connect to the database:

```bash
cd backend
node test-supabase.js
```

**Expected output:**
```
✅ Connected to Supabase successfully!
Faculty count: 3
Subjects count: 5
Rooms count: 5
```

If you see errors, double-check your `.env` credentials with your team lead.

---

## 🎯 Running the Application

You need to run **THREE services** simultaneously. Open **three separate terminal windows/tabs**:

### Terminal 1: Backend Server

```bash
cd backend
npm start
```

**Expected output:**
```
✅ Supabase client initialized
ChronoMaria Backend Server running on port 5000
```

**Backend will be available at:** `http://localhost:5000`

### Terminal 2: Frontend Development Server

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  press h + enter to show help
```

**Frontend will be available at:** `http://localhost:3000`

### Terminal 3: Python Genetic Algorithm Service

```bash
cd genetic_algorithm
python server.py
```

If `python server.py` fails on Windows, run:

```powershell
c:/python314/python.exe server.py
```

**Expected output:**
```
* Running on http://0.0.0.0:8000
* Debug mode: on
```

**GA Service will be available at:** `http://localhost:8000`

---

### 🌐 Access the Application

Once all three services are running:

1. Open your web browser
2. Go to: **http://localhost:3000**
3. You'll see the login page

**Login Credentials (Development)**
- Username: `admin` (or any text)
- Password: `admin` (or any text)
- *Note: Authentication is placeholder for now*

## 📱 Features & Usage

### Dashboard
- View system statistics
- See total faculty, subjects, and rooms
- Quick overview of data availability

### Faculty Management
- Add new faculty members
- Edit faculty information (name, email, department, max units)
- Delete faculty members
- Set preferred subjects for each faculty

### Subject Management
- Add subjects with codes and details
- Specify units and hours per week
- Organize by department
- Edit or delete subjects

### Room Management
- Add classrooms and facilities
- Specify building, capacity, and type
- Manage room availability
- Edit or delete rooms

### Schedule Generation
- Configure genetic algorithm parameters:
  - Population size (default: 100)
  - Max generations (default: 1000)
  - Mutation rate (default: 0.1)
- Generate optimized schedules automatically
- View fitness scores and generation counts
- See complete schedule assignments

## 🔧 API Endpoints

### Faculty
- `GET /api/faculty` - Get all faculty
- `GET /api/faculty/:id` - Get specific faculty member
- `POST /api/faculty` - Create new faculty
- `PUT /api/faculty/:id` - Update faculty
- `DELETE /api/faculty/:id` - Delete faculty

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get specific subject
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get specific room
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Schedule
- `POST /api/schedule/generate` - Generate optimized schedule
- `POST /api/schedule/validate` - Validate schedule for conflicts

## 🧬 Genetic Algorithm Details

The system uses a genetic algorithm to optimize faculty schedules:

1. **Initialization**: Creates random population of possible schedules
2. **Fitness Evaluation**: Scores each schedule based on:
   - No faculty time conflicts
   - No room double-bookings
   - Balanced faculty workload
   - Faculty preference matching
3. **Selection**: Tournament selection chooses best schedules
4. **Crossover**: Combines parent schedules to create offspring
5. **Mutation**: Random changes maintain genetic diversity
6. **Iteration**: Repeats until optimal solution or max generations reached

**Constraints Handled:**
- Faculty cannot teach multiple classes simultaneously
- Rooms cannot be double-booked
- Faculty workload distribution
- Time slot availability

## 🛠️ Troubleshooting

### Backend Won't Start

**Problem:** `npm: command not found` or `node: command not found`
- **Solution**: Install Node.js from https://nodejs.org/

**Problem:** `Module not found` errors
- **Solution**: 
  ```bash
  cd backend
  rm -rf node_modules
  npm install
  ```

**Problem:** "Cannot connect to Supabase"
- **Solution**: Check your `.env` file has correct Supabase credentials
- Verify your Supabase project is active (not paused)

### Frontend Won't Start

**Problem:** Port 3000 already in use
- **Solution**: Kill the process using port 3000
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <process-id> /F

  # Mac/Linux
  lsof -ti:3000 | xargs kill -9
  ```

**Problem:** Frontend can't connect to backend
- **Solution**: Ensure backend is running on port 5000
- Check `frontend/vite.config.js` proxy settings

### Python Service Won't Start

**Problem:** `pip: command not found` or `python: command not found`
- **Solution**: Install Python from https://www.python.org/downloads/
- Make sure "Add Python to PATH" was checked during installation

**Problem:** `ModuleNotFoundError: No module named 'flask'`
- **Solution**:
  ```bash
  pip install flask flask-cors
  ```

**Problem:** Port 8000 already in use
- **Solution**: Kill the process or change port in `server.py`

### Schedule Generation Fails

**Problem:** "Failed to generate schedule"
- **Solution**: Ensure all three services are running
- Check that you have added faculty, subjects, and rooms
- Verify Python service is responding: http://localhost:8000/health

### Windows PowerShell Script Execution Error

**Problem:** `cannot be loaded because running scripts is disabled`
- **Solution**:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

## 📊 Sample Data

The database setup script includes sample data:
- 3 Faculty members (Computer Science & IT departments)
- 5 Subjects (CS101-IT201)
- 5 Rooms (Computer labs, lecture halls, classrooms)

You can add, edit, or delete this data through the web interface.

## 🚀 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite hot-reload enabled by default
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output will be in frontend/dist/
```

**Backend:**
No build step needed for Node.js. Just ensure `.env` is configured for production.

## 🔐 Security Notes

- Current authentication is placeholder only
- Never commit `.env` files to version control
- Change default credentials before deploying to production
- Use environment variables for sensitive data
- Enable Supabase Row Level Security (RLS) for production

## 👥 Team Setup Checklist

For team members cloning from GitHub:

- [ ] Install Node.js (v16+) and Python (v3.8+)
- [ ] Clone the repository from GitHub
- [ ] Install backend dependencies (`cd backend && npm install`)
- [ ] Install frontend dependencies (`cd frontend && npm install`)
- [ ] Install Python dependencies (`cd genetic_algorithm && pip install -r requirements.txt`)
- [ ] Get Supabase credentials from team lead
- [ ] Create `backend/.env` file with provided credentials
- [ ] Test database connection (`cd backend && node test-supabase.js`)
- [ ] Start all three services (backend, frontend, Python)
- [ ] Access http://localhost:3000 in your browser

## 📝 Notes

- **Development Mode**: All three services must run simultaneously
- **Ports Used**: 3000 (frontend), 5000 (backend), 8000 (Python GA)
- **Database**: Supabase handles hosting, backups, and scaling
- **Hot Reload**: Frontend and backend support code changes without restart

## 🤝 Support

If you encounter issues:
1. Check this README's troubleshooting section
2. Verify all prerequisites are installed correctly
3. Ensure all three services are running
4. Check Supabase project is active and credentials are correct

## 📄 License

MIT License

## 👨‍💻 Development Team

ChronoMaria - Faculty Loading Automation System
Developed with ❤️ for educational institutions

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
