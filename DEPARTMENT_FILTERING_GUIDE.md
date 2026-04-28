# Department-Based Filtering Implementation Guide

## Overview
This document outlines the implementation of department-based filtering using the new `departments` table as the main reference point.

## Database Structure

### Departments Table
```sql
CREATE TABLE departments (
  department_id SERIAL PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL UNIQUE,
  department_program VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Updated Tables
All the following tables now have a `department_id` foreign key reference:
- `users` - `department_id` (users belongs to a department)
- `faculty` - `department_id` (faculty belongs to a department)
- `subjects` - `department_id` (subjects belong to a department)
- `rooms` - `department_id` (rooms belong to a department)

## Migration Steps

1. **Run the migration to create the departments table:**
   ```bash
   node backend/migrations/20260428_create_departments.js
   ```

2. **Manually insert your departments into the database:**
   ```sql
   INSERT INTO departments (department_name, department_program) VALUES
   ('Computer Science', 'BS Computer Science'),
   ('Engineering', 'BS Engineering'),
   ('Business', 'BS Business Administration');
   -- Add your actual departments here
   ```

3. **Update existing data to use department_id:**
   You'll need to migrate existing department names to department IDs in:
   - users table
   - faculty table
   - subjects table
   - rooms table

## Backend Changes

### Models Updated
- **Faculty.js** - Now uses `department_id` and joins with `departments` table
- **Subject.js** - Now uses `department_id` and joins with `departments` table
- **Room.js** - Now uses `department_id` and joins with `departments` table
- **Department.js** - NEW: Handles department CRUD operations

### API Behavior
- When filtering by department, pass `department` query parameter as an ID (number)
- API responses include the full department object with all details
- Super admins see all departments (no department filter applied)
- Regular users only see their assigned department's data

Example requests:
```
GET /api/faculty?department=1  // Gets all faculty in department 1
GET /api/subjects?department=2  // Gets all subjects in department 2
GET /api/rooms?department=1     // Gets all rooms in department 1
```

## Frontend Changes

### authHelper.js
Updated to work with `department_id`:
- `getCurrentUser()` - Gets user from localStorage
- `isSuperAdmin()` - Checks if user is Super Admin
- `getDepartmentFilter()` - Returns user's `department_id` (or null for super admins)

### API Service
The `api.js` file now:
- Imports `getDepartmentFilter()` from authHelper
- Passes `department_id` as query parameter for faculty, subjects, and rooms
- Super admins send no department filter (get all data)
- Regular users send their department_id (only see their department)

## Data Structure in API Responses

### Faculty Response
```json
{
  "id": 1,
  "name": "Dr. Smith",
  "email": "smith@example.com",
  "department_id": 1,
  "max_units": 18,
  "preferred_subjects": "1,2,3",
  "departments": {
    "department_id": 1,
    "department_name": "Computer Science",
    "department_program": "BS Computer Science"
  }
}
```

### Subject Response
```json
{
  "id": 1,
  "code": "CS101",
  "name": "Introduction to Programming",
  "units": 3,
  "hours_per_week": 4,
  "department_id": 1,
  "department": "Computer Science",
  "department_program": "BS Computer Science",
  "course_no": "101",
  "section": "A"
}
```

### Room Response
```json
{
  "id": 1,
  "room_number": "101",
  "building": "Science Building",
  "capacity": 30,
  "type": "Classroom",
  "department_id": 1,
  "departments": {
    "department_id": 1,
    "department_name": "Computer Science",
    "department_program": "BS Computer Science"
  }
}
```

## Frontend UI Updates Needed

When updating the Faculty, Subjects, and Rooms pages, you'll need to:

1. **Department Picker** - Show `department_name` but store `department_id`
2. **Display** - Show department name instead of ID in tables
3. **Create/Update Forms** - Accept department name but submit department_id

Example form handling:
```javascript
// When selecting a department
const dept = departmentOptions.find(d => d.department_name === selectedName);
setCurrentFaculty({...currentFaculty, department_id: dept.department_id});

// When displaying
<td>{item.departments?.department_name || 'N/A'}</td>
```

## Testing Checklist

- [ ] Run migration successfully
- [ ] Insert departments into database
- [ ] Migrate existing data to use department_id
- [ ] Login with a regular user - should only see their department
- [ ] Login with Super Admin - should see all departments
- [ ] Create new faculty/subject/room - should automatically assign to user's department (for regular users)
- [ ] Filter by department works correctly
- [ ] Department information displays correctly in UI

## Important Notes

1. **Department_id is numeric** - Store and pass as numbers, not strings
2. **Super Admin exception** - Super Admins have `department_id = NULL` or no filter applied
3. **Backward compatibility** - If migrating from text-based departments, write migration scripts to map names to IDs
4. **Foreign Key Constraints** - Ensure all department_id references are valid before deletion

## Next Steps

1. Run the migration
2. Populate the departments table with your actual departments
3. Migrate existing data to use department_id
4. Update frontend components to display department_name instead of ID
5. Test with different user roles (Admin, Super Admin)
