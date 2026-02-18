# Quick Start Guide - Installing Prerequisites

## Step 1: Install Node.js (Required for Backend & Frontend)

### Download and Install:
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. **Important**: Check the box "Automatically install necessary tools" during installation
5. Restart your terminal/PowerShell after installation

### Verify Installation:
```powershell
node --version
npm --version
```

Should show versions like:
- Node: v20.x.x or v18.x.x
- npm: 10.x.x or 9.x.x

## Step 2: Install Python (Required for Genetic Algorithm)

### Download and Install:
1. Go to: https://www.python.org/downloads/
2. Download Python 3.11 or 3.12
3. **CRITICAL**: Check "Add Python to PATH" during installation
4. Complete installation
5. Restart terminal

### Verify Installation:
```powershell
python --version
pip --version
```

## Step 3: Setup Database (Using Supabase)

Your `.env` file is already configured! Next steps:

1. Go to Supabase SQL Editor: 
   https://supabase.com/dashboard/project/bgetctcanncenczqebrt/sql/new

2. Copy contents of `database_setup.sql`

3. Paste and click **Run**

## Step 4: Install Project Dependencies (After Node.js is installed)

```powershell
# Backend
cd C:\Users\hp\Desktop\ChronoMaria\backend
npm install

# Frontend
cd C:\Users\hp\Desktop\ChronoMaria\frontend
npm install

# Python (after Python is installed)
cd C:\Users\hp\Desktop\ChronoMaria\genetic_algorithm
pip install -r requirements.txt
```

## Step 5: Start All Services

```powershell
# Terminal 1 - Backend
cd C:\Users\hp\Desktop\ChronoMaria\backend
npm start

# Terminal 2 - Frontend
cd C:\Users\hp\Desktop\ChronoMaria\frontend
npm run dev

# Terminal 3 - Python GA
cd C:\Users\hp\Desktop\ChronoMaria\genetic_algorithm
python server.py
```

## Quick Installation Commands (Copy-Paste After Installing Node.js & Python)

```powershell
# Navigate to project
cd C:\Users\hp\Desktop\ChronoMaria

# Install all dependencies
cd backend
npm install
cd ..\frontend
npm install
cd ..\genetic_algorithm
pip install -r requirements.txt
cd ..

# Done! Now start services (see Step 5 above)
```

## Current Status:
- ✅ Project structure created
- ✅ Supabase configured (.env file ready)
- ⏳ Need to install Node.js
- ⏳ Need to install Python
- ⏳ Need to setup database tables in Supabase

## Next Immediate Action:
**Install Node.js from: https://nodejs.org/**

Then come back and run:
```powershell
cd C:\Users\hp\Desktop\ChronoMaria\backend
npm install
```
