# ChronoMaria Database Schema

## PostgreSQL Database Structure

### Faculty Table
```sql
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    max_units INTEGER DEFAULT 18,
    preferred_subjects TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_faculty_department ON faculty(department);
CREATE INDEX idx_faculty_email ON faculty(email);
```

### Subjects Table
```sql
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    units INTEGER NOT NULL,
    hours_per_week INTEGER NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_department ON subjects(department);
```

### Rooms Table
```sql
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_rooms_building ON rooms(building);
CREATE INDEX idx_rooms_type ON rooms(type);
```

### Schedules Table
```sql
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    fitness_score DECIMAL(10, 2),
    generations_used INTEGER,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_active ON schedules(is_active);
CREATE INDEX idx_schedules_semester ON schedules(semester, academic_year);
```

### Schedule Items Table
```sql
CREATE TABLE schedule_items (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries and constraint checking
CREATE INDEX idx_schedule_items_schedule ON schedule_items(schedule_id);
CREATE INDEX idx_schedule_items_faculty ON schedule_items(faculty_id);
CREATE INDEX idx_schedule_items_room ON schedule_items(room_id);
CREATE INDEX idx_schedule_items_time ON schedule_items(day_of_week, time_slot);

-- Unique constraint to prevent double booking of rooms
CREATE UNIQUE INDEX idx_unique_room_time ON schedule_items(
    schedule_id, room_id, day_of_week, time_slot
) WHERE room_id IS NOT NULL;
```

### Users Table (for authentication)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

## Sample Data

### Sample Faculty Data
```sql
INSERT INTO faculty (name, email, department, max_units, preferred_subjects) VALUES
('Dr. John Smith', 'john.smith@university.edu', 'Computer Science', 18, 'Data Structures, Algorithms'),
('Prof. Mary Johnson', 'mary.johnson@university.edu', 'Computer Science', 15, 'Database Systems, Web Development'),
('Dr. Robert Brown', 'robert.brown@university.edu', 'Information Technology', 18, 'Networking, System Administration');
```

### Sample Subjects Data
```sql
INSERT INTO subjects (code, name, units, hours_per_week, department) VALUES
('CS101', 'Introduction to Programming', 3, 5, 'Computer Science'),
('CS201', 'Data Structures and Algorithms', 3, 5, 'Computer Science'),
('CS301', 'Database Systems', 3, 5, 'Computer Science'),
('IT101', 'Computer Networks', 3, 5, 'Information Technology'),
('IT201', 'System Administration', 3, 5, 'Information Technology');
```

### Sample Rooms Data
```sql
INSERT INTO rooms (room_number, building, capacity, type) VALUES
('CS-101', 'Computer Science Building', 40, 'Computer Lab'),
('CS-102', 'Computer Science Building', 35, 'Computer Lab'),
('LH-201', 'Main Building', 100, 'Lecture Hall'),
('LAB-301', 'Science Building', 30, 'Laboratory'),
('CR-401', 'Main Building', 50, 'Classroom');
```

### Sample User Data
```sql
-- Password: admin123 (use proper hashing in production)
INSERT INTO users (username, password_hash, email, role) VALUES
('admin', '$2b$10$examplehash', 'admin@university.edu', 'admin');
```

## Database Views

### Faculty Workload View
```sql
CREATE VIEW faculty_workload AS
SELECT 
    f.id,
    f.name,
    f.department,
    COUNT(si.id) as assigned_subjects,
    SUM(s.units) as total_units
FROM faculty f
LEFT JOIN schedule_items si ON f.id = si.faculty_id
LEFT JOIN subjects s ON si.subject_id = s.id
WHERE si.schedule_id IN (SELECT id FROM schedules WHERE is_active = true)
GROUP BY f.id, f.name, f.department;
```

### Room Utilization View
```sql
CREATE VIEW room_utilization AS
SELECT 
    r.id,
    r.room_number,
    r.building,
    COUNT(si.id) as time_slots_used,
    ROUND((COUNT(si.id)::DECIMAL / 45) * 100, 2) as utilization_percentage
FROM rooms r
LEFT JOIN schedule_items si ON r.id = si.room_id
WHERE si.schedule_id IN (SELECT id FROM schedules WHERE is_active = true)
GROUP BY r.id, r.room_number, r.building;
```

## Stored Procedures

### Validate Schedule Conflicts
```sql
CREATE OR REPLACE FUNCTION check_schedule_conflicts(p_schedule_id INTEGER)
RETURNS TABLE (
    conflict_type VARCHAR,
    details TEXT
) AS $$
BEGIN
    -- Check faculty conflicts
    RETURN QUERY
    SELECT 
        'Faculty Conflict'::VARCHAR,
        'Faculty ' || f.name || ' assigned to multiple classes at ' || 
        si.day_of_week || ' ' || si.time_slot
    FROM schedule_items si
    JOIN faculty f ON si.faculty_id = f.id
    WHERE si.schedule_id = p_schedule_id
    GROUP BY f.id, f.name, si.day_of_week, si.time_slot
    HAVING COUNT(*) > 1;
    
    -- Check room conflicts
    RETURN QUERY
    SELECT 
        'Room Conflict'::VARCHAR,
        'Room ' || r.room_number || ' double-booked at ' || 
        si.day_of_week || ' ' || si.time_slot
    FROM schedule_items si
    JOIN rooms r ON si.room_id = r.id
    WHERE si.schedule_id = p_schedule_id
    GROUP BY r.id, r.room_number, si.day_of_week, si.time_slot
    HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;
```

## Backup and Maintenance

### Backup Command
```bash
pg_dump -U postgres -d chronomaria > chronomaria_backup.sql
```

### Restore Command
```bash
psql -U postgres -d chronomaria < chronomaria_backup.sql
```

### Regular Maintenance
```sql
-- Vacuum and analyze tables
VACUUM ANALYZE faculty;
VACUUM ANALYZE subjects;
VACUUM ANALYZE rooms;
VACUUM ANALYZE schedules;
VACUUM ANALYZE schedule_items;
```

## Performance Optimization

1. **Indexes**: Created on foreign keys and frequently queried columns
2. **Views**: Pre-computed aggregations for common queries
3. **Constraints**: Database-level validation for data integrity
4. **Partitioning**: Consider partitioning schedule_items by academic year for large datasets

## Security Considerations

1. Use prepared statements to prevent SQL injection
2. Hash passwords with bcrypt or argon2
3. Implement row-level security for multi-tenant scenarios
4. Regular backups and disaster recovery plan
5. Encrypt sensitive data at rest and in transit
