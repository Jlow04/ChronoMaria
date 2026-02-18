# ChronoMaria Setup Guide for Windows

## Prerequisites Installation

### Option 1: Install PostgreSQL (Recommended)

1. **Download PostgreSQL**:
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer for Windows (version 12 or higher)
   - Run the installer and follow the wizard

2. **During Installation**:
   - Remember your PostgreSQL password (you'll need it)
   - Default port: 5432
   - Install pgAdmin 4 (GUI tool) - recommended
   - Install Command Line Tools

3. **Add PostgreSQL to PATH** (if not done automatically):
   ```powershell
   # Find your PostgreSQL installation (usually):
   # C:\Program Files\PostgreSQL\15\bin
   
   # Add to PATH temporarily:
   $env:Path += ";C:\Program Files\PostgreSQL\15\bin"
   
   # Or permanently (run PowerShell as Administrator):
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\15\bin", "Machine")
   ```

### Option 2: Use pgAdmin (GUI - Easier for Beginners)

If you install PostgreSQL with pgAdmin:

1. **Open pgAdmin 4**
2. **Connect to PostgreSQL** (enter your password)
3. **Create Database**:
   - Right-click on "Databases" → "Create" → "Database"
   - Name: `chronomaria`
   - Click "Save"
4. **Run Setup Script**:
   - Right-click on `chronomaria` database → "Query Tool"
   - Open file: `database_setup.sql`
   - Click "Execute" (▶️ button)

### Option 3: Use Docker (For Development)

```powershell
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name chronomaria-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=chronomaria -p 5432:5432 -d postgres:15

# Access database
docker exec -it chronomaria-db psql -U postgres -d chronomaria
```

Then copy and paste contents of `database_setup.sql` into the psql prompt.

## Database Setup Methods

### Method 1: Using Command Line (After PostgreSQL is in PATH)

```powershell
# Create database
createdb -U postgres chronomaria

# Run setup script
psql -U postgres -d chronomaria -f database_setup.sql
```

### Method 2: Using PowerShell with Full Path

```powershell
# Replace with your actual PostgreSQL installation path
$pgPath = "C:\Program Files\PostgreSQL\15\bin"

# Create database
& "$pgPath\createdb.exe" -U postgres chronomaria

# Run setup script
& "$pgPath\psql.exe" -U postgres -d chronomaria -f database_setup.sql
```

### Method 3: Manual Setup via pgAdmin (Easiest)

See "Option 2" above.

### Method 4: Using Node.js Setup Script

I've created a Node.js script to set up the database:

```powershell
cd backend
npm install
node setup-database.js
```

## Backend Setup

1. **Install Dependencies**:
   ```powershell
   cd backend
   npm install
   ```

2. **Configure Environment**:
   ```powershell
   # Copy example env file
   cp .env.example .env
   
   # Edit .env file with your database credentials
   # Use notepad or any text editor:
   notepad .env
   ```

   Update these values in `.env`:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=chronomaria
   PYTHON_SERVICE_URL=http://localhost:8000
   ```

3. **Start Backend**:
   ```powershell
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   Backend will run on: http://localhost:5000

## Frontend Setup

1. **Install Dependencies**:
   ```powershell
   cd frontend
   npm install
   ```

2. **Start Frontend**:
   ```powershell
   npm run dev
   ```

   Frontend will run on: http://localhost:3000

## Python Genetic Algorithm Service Setup

1. **Check Python Installation**:
   ```powershell
   python --version
   # Should show Python 3.8 or higher
   ```

   If Python is not installed:
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Create Virtual Environment** (Recommended):
   ```powershell
   cd genetic_algorithm
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

   If you get an execution policy error:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Start GA Service**:
   ```powershell
   python server.py
   ```

   GA Service will run on: http://localhost:8000

## Verification

Test if all services are running:

```powershell
# Test Backend
curl http://localhost:5000/api/health

# Test GA Service
curl http://localhost:8000/health

# Frontend - Open in browser
start http://localhost:3000
```

## Troubleshooting

### "Cannot find module" errors
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### PostgreSQL connection errors
- Verify PostgreSQL is running (check Services or Task Manager)
- Check credentials in `.env` file
- Test connection: `psql -U postgres -d chronomaria`

### Port already in use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Python virtual environment issues
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned

# Or bypass for current session
powershell -ExecutionPolicy Bypass
```

## Quick Start (Assuming All Prerequisites Installed)

```powershell
# Terminal 1: Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Python GA Service
cd genetic_algorithm
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python server.py
```

Then open http://localhost:3000 in your browser!

## Next Steps

1. Install PostgreSQL if not installed
2. Set up the database using one of the methods above
3. Configure backend `.env` file
4. Start all three services
5. Access the application at http://localhost:3000

## Need Help?

- PostgreSQL Installation: https://www.postgresql.org/download/windows/
- Node.js Installation: https://nodejs.org/
- Python Installation: https://www.python.org/downloads/
