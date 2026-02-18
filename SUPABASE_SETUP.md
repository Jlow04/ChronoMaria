# Supabase Setup Guide for ChronoMaria

## Step 1: Get Your Database Password

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **bgetctcanncenczqebrt**
3. Go to **Settings** → **Database**
4. Find your **Database Password** (you set this when creating the project)
   - If you forgot it, you can reset it in the same section

## Step 2: Configure Backend

```powershell
cd backend

# Copy the example env file
Copy-Item .env.example .env

# Edit the .env file
notepad .env
```

Your `.env` file should look like this (replace `your_actual_password` with your real password):

```env
PORT=5000

# Supabase Configuration
SUPABASE_URL=https://bgetctcanncenczqebrt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXRjdGNhbm5jZW5jenFlYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTAwODMsImV4cCI6MjA4Njk4NjA4M30.0XmgaJz0n43NsXSPhf2cdldDvulctXy8ILLuhUH8wPQ

# Database Configuration
DB_HOST=db.bgetctcanncenczqebrt.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_NAME=postgres
DB_SSL=true

PYTHON_SERVICE_URL=http://localhost:8000
```

## Step 3: Setup Database Tables

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `database_setup.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

### Option B: Using Node.js Setup Script

```powershell
cd backend
npm install
npm run setup-db
```

## Step 4: Verify Database Setup

In Supabase dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - faculty
   - subjects
   - rooms
   - schedules
   - schedule_items
   - users

3. Click on each table to verify sample data was inserted

## Step 5: Start the Application

```powershell
# Terminal 1 - Backend
cd backend
npm install
npm start
# Should show: "Connected to Supabase PostgreSQL database"
# Backend runs on: http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
# Frontend runs on: http://localhost:3000

# Terminal 3 - Python GA Service
cd genetic_algorithm
pip install -r requirements.txt
python server.py
# GA service runs on: http://localhost:8000
```

## Step 6: Test the Application

Open your browser to: http://localhost:3000

You should be able to:
- Login (any credentials will work for now)
- View Dashboard
- Add/Edit/Delete Faculty members
- Add/Edit/Delete Subjects
- Add/Edit/Delete Rooms
- Generate Schedules

## Troubleshooting

### "password authentication failed for user postgres"
- Your database password in `.env` is incorrect
- Go to Supabase → Settings → Database → Reset password

### "no pg_hba.conf entry for host"
- Make sure `DB_SSL=true` is in your `.env` file
- Supabase requires SSL connections

### "relation does not exist"
- Tables haven't been created yet
- Run the SQL setup script in Supabase SQL Editor

### Connection timeout
- Check your internet connection
- Verify the Supabase project URL is correct
- Check if your IP is allowed (Supabase allows all IPs by default)

## Testing Database Connection

```powershell
cd backend
node -e "require('./config/database').query('SELECT NOW()', (err, res) => { console.log(err || res.rows[0]); process.exit(); })"
```

This should print the current timestamp if connection is successful.

## Next Steps

1. Get your database password from Supabase
2. Create and configure `.env` file
3. Run the database setup SQL in Supabase SQL Editor
4. Start all three services
5. Open http://localhost:3000 and start using the app!
