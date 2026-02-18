-- ChronoMaria Database Schema Setup Script
-- Run this script to create all necessary tables

-- Create Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    max_units INTEGER DEFAULT 18,
    preferred_subjects TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);

-- Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    units INTEGER NOT NULL,
    hours_per_week INTEGER NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department);

-- Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);

-- Create Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
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

CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_semester ON schedules(semester, academic_year);

-- Create Schedule Items Table
CREATE TABLE IF NOT EXISTS schedule_items (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_items_schedule ON schedule_items(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_faculty ON schedule_items(faculty_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_room ON schedule_items(room_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_time ON schedule_items(day_of_week, time_slot);

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert sample data (optional)
INSERT INTO faculty (name, email, department, max_units, preferred_subjects) VALUES
('Dr. John Smith', 'john.smith@university.edu', 'Computer Science', 18, 'Data Structures, Algorithms'),
('Prof. Mary Johnson', 'mary.johnson@university.edu', 'Computer Science', 15, 'Database Systems, Web Development'),
('Dr. Robert Brown', 'robert.brown@university.edu', 'Information Technology', 18, 'Networking, System Administration')
ON CONFLICT DO NOTHING;

INSERT INTO subjects (code, name, units, hours_per_week, department) VALUES
('CS101', 'Introduction to Programming', 3, 5, 'Computer Science'),
('CS201', 'Data Structures and Algorithms', 3, 5, 'Computer Science'),
('CS301', 'Database Systems', 3, 5, 'Computer Science'),
('IT101', 'Computer Networks', 3, 5, 'Information Technology'),
('IT201', 'System Administration', 3, 5, 'Information Technology')
ON CONFLICT DO NOTHING;

INSERT INTO rooms (room_number, building, capacity, type) VALUES
('CS-101', 'Computer Science Building', 40, 'Computer Lab'),
('CS-102', 'Computer Science Building', 35, 'Computer Lab'),
('LH-201', 'Main Building', 100, 'Lecture Hall'),
('LAB-301', 'Science Building', 30, 'Laboratory'),
('CR-401', 'Main Building', 50, 'Classroom')
ON CONFLICT DO NOTHING;
